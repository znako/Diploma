import json
import math
import os
import traceback

import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
from pyomo.environ import *
from pyomo.opt import SolverStatus, TerminationCondition

app = Flask(__name__)
CORS(app)

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
            domain = Binary    ## ДОБАВИТЬ ПРОВЕРКУ НА ДОЛБАЕБОВ
        model.variables[i].domain = domain  # Присвоение домена переменной

    # Задание целевой функции
    objective_expr = sum(coeff * model.variables[i] for i, coeff in enumerate(data['objective']['coefficients']))
    if data['objective']['sense'] == 'maximize':
        model.obj = Objective(expr=objective_expr, sense=maximize)
    else:
        model.obj = Objective(expr=objective_expr, sense=minimize)
        ## ДОБАВИТЬ ПРОВЕРКУ НА ДОЛБАЕБОВ

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
        ## ДОБАВИТЬ ПРОВЕРКУ НА ДОЛБАЕБОВ

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
        solution = solve_model(model)
        response = jsonify(solution)
        response.headers['Content-Type'] = 'application/json; charset=utf-8'
        return response
    except Exception as e:
        return handle_exception(e)



# Валидация данных
def validate_data(df):
    print(df)
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

@app.route('/solve_milp/excel', methods=['POST'])
def upload_excel():
    # Проверка наличия файла в запросе
    if 'file' not in request.files:
        return jsonify({'error': 'Вы не отправили файл'}), 400

    file = request.files['file']

    # Проверка, что файл имеет нужное имя
    # if file.filename == '':
    #     return jsonify({'error': 'No selected file'}), 400

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

    # Решение задачи
    try:
        model = create_model(data)
        solution = solve_model(model)
        response = jsonify(solution)
        response.headers['Content-Type'] = 'application/json; charset=utf-8'
        return response
    except Exception as e:
        # print(e)
        return handle_exception(e)


if __name__ == '__main__':
    # upload_excel()
    app.run(debug=True)
