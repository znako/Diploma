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
from sqlalchemy import JSON, Column, DateTime, Integer, String, create_engine
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
    upload_time = Column(DateTime, default=datetime.now)  # время загрузки задачи
    solve_time = Column(DateTime)  # время завершения решения задачи
    
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
        elif constr['sense'] == '==':
            model.constraints.add(expr == constr['rhs'])

    return model

def solve_model(model):
    solver = SolverFactory('glpk')
    result = solver.solve(model)

    if result.solver.status == SolverStatus.ok:
        termination_condition = str(result.solver.termination_condition)
        if result.solver.termination_condition == TerminationCondition.optimal:
            return {
                'termination_condition': termination_condition,
                'message': "Найдено оптимальное решение задачи.",
                'objective': model.obj(),
                'variable_values': {i: model.variables[i].value for i in model.variables}
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
                    'variable_values': {i: model.variables[i].value for i in model.variables}
                }
            except:
                return {
                    # 'status': status,
                    'termination_condition': termination_condition,
                    'message': str(result.solver.termination_condition),
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

@app.route('/solve_milp', methods=['POST'])
def solve_milp_route():
    data = request.json
    try:
        model = create_model(data)
    except Exception as e:
        return handle_exception(e)

    task_id = str(uuid.uuid4())
    # Запускаем фоновую задачу
    executor = ThreadPoolExecutor(max_workers=1)
    executor.submit(process_excel_task, task_id, model, data)
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
        if df.iloc[0, 7 + 3*i] != '==' and df.iloc[0, 7 + 3*i] != '<=' and df.iloc[0, 7 + 3*i] != '>=':
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

# Фоновая функция для обработки Excel–запроса и решения задачи
def process_excel_task(task_id, model, conditions_json):
    tasks[task_id] = {"status": "processing", "log": [], "result": None}
    db = SessionLocal()
    # Создаем запись в БД (upload_time установится автоматически)
    task_record = Task(task_id=task_id, conditions=conditions_json)
    db.add(task_record)
    db.commit()

    try:
        tasks[task_id]["log"].append("Начало решения задачи...")
        start_time = datetime.now(timezone.utc)
        # Используем ThreadPoolExecutor для решения с имитацией промежуточных сообщений.
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(solve_model, model)
            while not future.done():
                # Каждую секунду добавляем сообщение о ходе выполнения
                tasks[task_id]["log"].append("Решение задачи в процессе...")
                time.sleep(1)
            solution = future.result()
        finish_time = datetime.now(timezone.utc)
        tasks[task_id]["log"].append("Решение задачи завершено.")
        tasks[task_id]["result"] = solution
        tasks[task_id]["status"] = "done"

        # Обновляем запись в БД – сохраняем решение и время завершения
        task_record.solution = solution
        task_record.solve_time = finish_time
        db.commit()
    except Exception as e:
        tasks[task_id]["log"].append(f"Ошибка: {str(e)}")
        tasks[task_id]["status"] = "error"
    finally:
        db.close()

# Эндпоинт для загрузки Excel и запуска фоновой задачи
@app.route('/solve_milp/excel', methods=['POST'])
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
    data = None
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


    task_id = str(uuid.uuid4())
    # Запускаем фоновую задачу
    executor = ThreadPoolExecutor(max_workers=1)
    executor.submit(process_excel_task, task_id, model, data)
    executor.shutdown(wait=False)  # не блокируем поток
    return jsonify({'task_id': task_id}), 202

# Эндпоинт SSE для получения обновлений по задаче (task_progress)
@app.route('/task_progress/<task_id>', methods=['GET'])
def task_progress(task_id):
    def event_stream():
        last_index = 0
        # Отправляем данные до тех пор, пока задача не завершена
        while True:
            if task_id not in tasks:
                yield "data: error: Задача не найдена\n\n"
                break
            log = tasks[task_id]["log"]
            while last_index < len(log):
                yield "data: " + log[last_index] + "\n\n"
                last_index += 1
            if tasks[task_id]["status"] in ("done", "error"):
                # Если задача завершена, отправляем итоговый результат (если он есть)
                if tasks[task_id]["status"] == "done" and tasks[task_id]["result"] is not None:
                    yield "data: " + json.dumps(tasks[task_id]["result"], ensure_ascii=False) + "\n\n"
                if tasks[task_id]["status"] == "error":
                    yield "data: " + "[error]" + "\n\n"
                break
            time.sleep(1)
        yield "data: [end]\n\n"
    return Response(event_stream(), mimetype="text/event-stream")

if __name__ == '__main__':
    # upload_excel()
    app.run(debug=True, threaded=True)
