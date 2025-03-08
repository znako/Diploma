import json
import os
import traceback

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
        solution = solve_model(model)
        response = jsonify(solution)
        response.headers['Content-Type'] = 'application/json; charset=utf-8'
        return response
    except Exception as e:
        return handle_exception(e)


if __name__ == '__main__':
    app.run(debug=True)
