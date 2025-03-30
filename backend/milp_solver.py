import base64
import json
import math
import os
import time
import traceback
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from io import BytesIO

import pandas as pd
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from pyomo.environ import *
from pyomo.opt import SolverStatus, TerminationCondition
from sqlalchemy import (JSON, Boolean, Column, DateTime, Integer, String, Text,
                        create_engine)
from sqlalchemy.orm import declarative_base, sessionmaker

app = Flask(__name__)
CORS(app)

# Настройка подключения к PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Определение модели для хранения задач в БД
class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, unique=True, index=True, nullable=False)
    conditions = Column(JSON, nullable=False)  # исходные условия задачи (JSON)
    solution = Column(JSON)  # решение задачи (JSON), может быть пустым, если задача не решена
    conditions_excel = Column(Text)  # новое поле для хранения сгенерированного Excel файла в виде base64 строки
    upload_time = Column(DateTime, default=datetime.now)  # время загрузки задачи
    solve_time = Column(DateTime)  # время завершения решения задачи
    canceled = Column(Boolean, default=False)  # отмена решения задачи пользователем
    
# Создание таблицы, если она еще не создана
Base.metadata.create_all(bind=engine)

# Глобальное хранилище задач, формат:
# tasks = { task_id: { "status": "processing"/"done"/"error",
# "log": [сообщения о ходе выполнения],
# "result": результат или None } }
tasks = {}

def load_model_from_file(file_path):
    with open(file_path, 'r') as f:
        return json.load(f)

def create_model(data):
    model = ConcreteModel()

    # Создание переменных
    model.variables = Var(range(len(data['variable_domains'])), domain=NonNegativeReals)  # Инициализация на основе первого домена
    for i, var in enumerate(data['variable_domains']):
        if var == 'NonNegativeReals':
            domain = NonNegativeReals
        elif var == 'NonNegativeIntegers':
            domain = NonNegativeIntegers
        elif var == 'Integers':
            domain = Integers    
        elif var == 'Reals':
            domain = Reals    
        elif var == 'Binary':
            domain = Binary 
        model.variables[i].domain = domain  # Присвоение домена переменной

    # Задание целевой функции
    objective_expr = sum(coeff * model.variables[i] for i, coeff in enumerate(data['objective']['coefficients']))
    if data['objective']['sense'] == 'maximize':
        model.obj = Objective(expr=objective_expr, sense=maximize)
    else:
        model.obj = Objective(expr=objective_expr, sense=minimize)

    # Создание ограничений
    model.constraints = ConstraintList()
    for constr in data['constraints']:
        expr = sum(coeff * model.variables[i] for i, coeff in enumerate(constr['coefficients']))
        if constr['sense'] == '<=':
            model.constraints.add(expr <= constr['rhs'])
        elif constr['sense'] == '>=':
            model.constraints.add(expr >= constr['rhs'])
        elif constr['sense'] == '=':
            model.constraints.add(expr == constr['rhs'])

    # Поддерживаем анализ чувствительности к коэффициентам
    model.dual = Suffix(direction=Suffix.IMPORT)
    return model

def solve_model(model):
    solver = SolverFactory('glpk')
    result = solver.solve(model)

    if result.solver.status == SolverStatus.ok:
        try:
            sensitivity = []
            for (i, constraint) in model.constraints.items():
                sensitivity.append({
                    "name": f"Ограничение {i}",
                    "value": str(constraint()),
                    "lslack": str(constraint.lslack()),
                    "uslack": str(constraint.uslack()),
                    "dual": str(model.dual[constraint])
                })
        except Exception as ex:
            print(ex, "Не удалось получить dual значения")
        termination_condition = str(result.solver.termination_condition)
        if result.solver.termination_condition == TerminationCondition.optimal:
            return {
                'termination_condition': termination_condition,
                'message': "Найдено оптимальное решение задачи.",
                'objective': model.obj(),
                'variable_values': {i: model.variables[i].value for i in model.variables},
                'sensitivity': sensitivity,
            }
        elif result.solver.termination_condition == TerminationCondition.infeasible:
            return {
                'termination_condition': termination_condition,
                'message': "Задача не имеет допустимых решений, удовлетворяющих всем ограничениям.",
            }
        elif result.solver.termination_condition == TerminationCondition.unbounded:
            return {
                'termination_condition': termination_condition,
                'message': "Целевая функция может быть улучшена безгранично.",
            }
        else:
            try:
                return {
                    'termination_condition': termination_condition,
                    'message': str(result.solver.termination_condition),
                    'objective': model.obj(),
                    'variable_values': {i: model.variables[i].value for i in model.variables},
                    'sensitivity': sensitivity,
                }
            except:
                return {
                    'termination_condition': termination_condition,
                    'message': f"Статус решателя: {str(result.solver.termination_condition)}",
                }
    else:
        raise Exception('Что-то пошло не так попробуйте позже или введите другую задачу')

@app.errorhandler(Exception)
def handle_exception(e):
    # Логируем полные трассировки исключений для отладки
    print("An error occurred:", traceback.format_exc())

    # Возвращаем ответ с корректными заголовками CORS
    response = jsonify({'error': str(e)})
    response.status_code = 500
    return response

@app.route('/task', methods=['POST'])
def solve_milp_route():
    data = request.json
    try:
        model = create_model(data)
    except Exception as e:
        return handle_exception(e)

    task_id = str(uuid.uuid4())
    conditions_excel = generate_excel_from_conditions(data)
    db = SessionLocal()
    # Создаем запись в БД (upload_time установится автоматически)
    task_record = Task(task_id=task_id, conditions=data, conditions_excel=conditions_excel)
    db.add(task_record)
    db.commit()
    db.close()

    # Запускаем фоновую задачу
    executor = ThreadPoolExecutor(max_workers=1)
    executor.submit(process_excel_task, task_id, model)
    executor.shutdown(wait=False)  # не блокируем поток
    return jsonify({'task_id': task_id}), 202


# Валидация данных
def validate_data(df):
    # Определим индексы или названия строк, в которые помещены одноэлементные значения
    index_variable_count = 0
    index_objective_sense = 3
    index_constraint_count = 4

    # Валидация количества переменных
    try:
        num_variables = int(df.iloc[0, index_variable_count])
    except:
        raise ValueError("Количество переменных должно быть целым числом")

    # Валидация количества ограничений
    try:
        num_constraints = int(df.iloc[0, index_constraint_count])
    except:
        raise ValueError("Количество ограничений должно быть целым числом")
    objective_sense = df.iloc[0, index_objective_sense]

    # Проверяем наличие столбцов
    expected_columns = {'Количество переменных', 'Указание на целочисленность', 'Коэффициенты функции', 'Вид оптимизации', 'Количество ограничений'}
    for i in range(num_constraints):
        expected_columns.add(f'Коэффициенты ограничения {i+1}')
        expected_columns.add(f'Правая часть ограничения {i+1}')
        expected_columns.add(f'Знак ограничения {i+1}')
    if not expected_columns.issubset(df.columns):
        raise ValueError('Неверный формат данных: пропущен обязательный столбец данных')

    # Валидация указания на целочисленность и коэффициентов
    if len(df.iloc[:, 1].dropna()) != num_variables:
        raise ValueError("Количество элементов в столбце указания на целочисленность не совпадает с количеством переменных")
    for x in df.iloc[:, 1]:
        if x != 'NonNegativeReals' and x != 'NonNegativeIntegers' and x != 'Integers' and x != 'Reals' and x != 'Binary':
            raise ValueError(f"Неверный формат значений столбца указания на целочисленность")
    if len(df.iloc[:, 2].dropna()) != num_variables:
        raise ValueError("Количество элементов в столбце коэффициентов функции не совпадает с количеством переменных")
    for x in df.iloc[:, 2]:
        try:
            float(x)
        except:
            raise ValueError(f"Коэффициентами функции могут быть только числа")

    # Валидация вида оптимизации
    if objective_sense != 'maximize' and objective_sense != 'minimize':
        raise ValueError("Неверный вид оптимизации")

    # Валидация ограничений
    for i in range(num_constraints):
        if len(df.iloc[:, 5 + 3*i].dropna()) != num_variables:
            raise ValueError(f"Количество коэффициентов в {i+1}-м ограничении не совпадает с количеством переменных")
        for x in df.iloc[:, 5 + 3*i]:
            try:
                float(x)
            except:
                raise ValueError(f"Коэффициентами ограничений могут быть только числа")
        try:
            float(df.iloc[0, 6 + 3*i])
        except:
            raise ValueError(f"Неверно задана правая часть в {i+1}-м ограничении")
        if df.iloc[0, 7 + 3*i] != '=' and df.iloc[0, 7 + 3*i] != '<=' and df.iloc[0, 7 + 3*i] != '>=':
            raise ValueError(f"Неверно задан знак ограничения в {i+1}-м ограничении")

# Преобразование данных в JSON
def convert_to_json(df):
    num_variables = int(df.iloc[0, 0])
    objective_sense = df.iloc[0, 3].strip().lower()
    num_constraints = int(df.iloc[0, 4])

    # Определим целочисленность переменных
    variable_domains = df.iloc[:, 1].tolist()

    # Формируем данные об объективной функции
    objective_coefficients = df.iloc[:, 2].tolist()

    objective = {
        "coefficients": objective_coefficients,
        "sense": objective_sense
    }

    # Формирование ограничений
    constraints = []

    for i in range(num_constraints):
        start_col = 5 + 3*i
        coefficients = df.iloc[:, start_col].tolist()
        rhs = float(df.iloc[0, start_col + 1])
        sense = df.iloc[0, start_col + 2]

        constraint = {
            "coefficients": coefficients,
            "rhs": rhs,
            "sense": sense
        }

        constraints.append(constraint)

    # Создание JSON структуры
    data_json = {
        "objective": objective,
        "variable_domains": variable_domains,
        "constraints": constraints
    }

    return data_json

def generate_excel_from_conditions(conditions: dict) -> str:
    """
    Генерирует Excel-файл из условий задачи (conditions) и возвращает его содержимое, закодированное в base64.
    """
    num_var = len(conditions.get("variable_domains", []))
    num_constraints = len(conditions.get("constraints", []))

    # Заполняем словарь данных для одного ряда Excel.
    data = {
        "Количество переменных": [num_var] + [None] * (num_var - 1),
        "Указание на целочисленность": conditions.get("variable_domains", []),
        "Коэффициенты функции": [str(x) for x in conditions.get("objective", {}).get("coefficients", [])],
        "Вид оптимизации": [conditions.get("objective", {}).get("sense", "")] + [None] * (num_var - 1),
        "Количество ограничений": [num_constraints] + [None] * (num_var - 1)
    }
    
    # Для каждого ограничения добавляем 3 колонки: коэффициенты, правая часть и знак.
    for i, constr in enumerate(conditions.get("constraints", []), start=1):
        col_coeff = f"Коэффициенты ограничения {i}"
        col_rhs   = f"Правая часть ограничения {i}"
        col_sign  = f"Знак ограничения {i}"
        data[col_coeff] = [str(x) for x in constr.get("coefficients", [])]
        data[col_rhs]   = [constr.get("rhs", "")] + [None] * (num_var - 1)
        data[col_sign]  = [constr.get("sense", "")] + [None] * (num_var - 1)
    
    # Создаем DataFrame
    df = pd.DataFrame(data)
    
    # Записываем DataFrame в Excel в памяти
    output = BytesIO()
    df.to_excel(output, index=False)
    excel_bytes = output.getvalue()
    
    # Кодируем в base64 и возвращаем строку
    b64_excel = base64.b64encode(excel_bytes).decode('utf-8')
    return b64_excel


# Фоновая функция для обработки Excel–запроса и решения задачи
def process_excel_task(task_id, model):
    tasks[task_id] = {"status": "processing", "log": [], "result": None}
    db = SessionLocal()
    # print(db.query(Task).filter(Task.task_id).first())
    task_record = db.query(Task).filter(Task.task_id == task_id).first()

    try:
        tasks[task_id]["log"].append("Начало решения задачи...")
        start_time = datetime.now(timezone.utc)
        # Используем ThreadPoolExecutor для решения с имитацией промежуточных сообщений.
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(solve_model, model)
            while not future.done():
                if task_record.canceled == True:
                    tasks[task_id]["log"].append("Решение задачи отменено.")
                    tasks[task_id]["status"] = "canceled"
                    return
                # Каждую секунду добавляем сообщение о ходе выполнения
                tasks[task_id]["log"].append("Решение задачи в процессе...")
                time.sleep(1)
            solution = future.result()
        tasks[task_id]["log"].append("Решение задачи завершено.")
        tasks[task_id]["result"] = solution
        tasks[task_id]["status"] = "done"

        # Обновляем запись в БД – сохраняем решение и время завершения
        task_record.solution = solution
        db.commit()
    except Exception as e:
        print(f"Ошибка: {str(e)}")
        tasks[task_id]["status"] = "error"
    finally:
        print(task_record.task_id)
        finish_time = datetime.now(timezone.utc)
        task_record.solve_time = finish_time
        db.commit()
        db.close()

# Эндпоинт для загрузки Excel и запуска фоновой задачи
@app.route('/task/excel', methods=['POST'])
def upload_excel():
    # Проверка наличия файла в запросе
    if 'file' not in request.files:
        return jsonify({'error': 'Вы не отправили файл'}), 400

    file = request.files['file']
    if not file.filename.endswith('.xlsx'):
        return jsonify({'error': 'Файл не является Excel файлом. Загрузите файл с расширением .xlsx'}), 400

    # Парсинг Excel файла
    df = None
    try:
        # df = pd.read_excel('../Книга1.xlsx', engine='openpyxl')
        df = pd.read_excel(file, engine='openpyxl')
    except Exception as e:
        # print(e)
        return jsonify({'error': f'Ошибка в чтении Excel файла: {str(e)}'}), 500
  
    # Валидация данных
    try:
        validate_data(df)
    except Exception as e:
        # print(e)
        return jsonify({'error': str(e)}), 400

    # Конвертация в JSON структуру
    try:
       data = convert_to_json(df)
    except Exception as e:
        # print(e)
        return handle_exception(e)

    # Создание модели
    try:
        model = create_model(data)
    except Exception as e:
        # print(e)
        return handle_exception(e)

    # Записываем DataFrame в Excel в памяти
    try:
        output = BytesIO()
        df.to_excel(output, index=False)
        excel_bytes = output.getvalue()
        
        # Кодируем в base64 и возвращаем строку
        b64_excel = base64.b64encode(excel_bytes).decode('utf-8')
    except Exception as e:
        return handle_exception(e)

    task_id = str(uuid.uuid4())
    db = SessionLocal()
    # Создаем запись в БД (upload_time установится автоматически)
    task_record = Task(task_id=task_id, conditions=data, conditions_excel=b64_excel)
    db.add(task_record)
    db.commit()
    db.close()

    # Запускаем фоновую задачу
    executor = ThreadPoolExecutor(max_workers=1)
    executor.submit(process_excel_task, task_id, model)
    executor.shutdown(wait=False)  # не блокируем поток
    return jsonify({'task_id': task_id}), 202


# Эндпоинт SSE для получения обновлений по задаче (task_progress)
@app.route('/task/task_progress/<task_id>', methods=['GET'])
def task_progress(task_id):
    def event_stream():
        last_index = 0
        # Отправляем данные до тех пор, пока задача не завершена
        while True:
            session = SessionLocal()
            # print(session.query(Task).filter(Task.task_id).first())
            task_record = session.query(Task).filter(Task.task_id == task_id).first()
            session.close()
            if not task_record:
                print("HEY")
                yield "data: [error]" + "\n\n"
                break
            if task_record.solve_time is None:
                yield "data: Задача в процессе выполнения...\n\n"
            else:
                # Задача завершена: если решение есть, отправляем его как JSON; иначе — сообщение об ошибке
                if task_record.solution:
                    payload = {}
                    payload["solution"] = task_record.solution
                    payload["conditions_excel"] = task_record.conditions_excel
                    
                    yield "data: " + json.dumps(payload, ensure_ascii=False) + "\n\n"
                else:
                    yield "data: [error]" + "\n\n"
                    break
            time.sleep(1)
        yield "data: [end]\n\n"
    return Response(event_stream(), mimetype="text/event-stream")

@app.route('/task/cancel_task/<task_id>', methods=['POST'])
def cancel_task(task_id):
    session = SessionLocal()
    task_record = session.query(Task).filter(Task.task_id == task_id).first()
    
    if task_id not in tasks:
        session.close()
        return jsonify({"error": "Задача не найдена"}), 404
    # Устанавливаем флаг отмены
    task_record.canceled = True
    session.close()
    tasks[task_id]["canceled"] = True
    # Здесь можно добавить логирование отмены
    tasks[task_id]["log"].append("Запрос на отмену получен.")
    return jsonify({"message": "Задача отменена"}), 200

if __name__ == '__main__':
    # upload_excel()
    app.run(debug=True, threaded=True)
