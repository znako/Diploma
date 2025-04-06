from pyomo.environ import *
from pyomo.opt import SolverStatus, TerminationCondition


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

def solve_model(model, solver):
    solver = SolverFactory(solver)
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