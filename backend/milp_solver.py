import json
from pyomo.environ import *

def load_model_from_file(file_path):
    with open(file_path, 'r') as f:
        return json.load(f)

def create_model(data):
    model = ConcreteModel()

    # Создание переменных
    model.variables = Var(range(len(data['variables'])), domain=NonNegativeReals)  # Инициализация на основе первого домена
    for i, var in enumerate(data['variables']):
        domain = NonNegativeReals if var['domain'] == 'NonNegativeReals' else NonNegativeIntegers
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
    result = SolverFactory('glpk').solve(model)
    model.display()

if __name__ == '__main__':
    data = load_model_from_file('model_input.json')
    model = create_model(data)
    solve_model(model)