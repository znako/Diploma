import base64
from io import BytesIO
import pandas as pd

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
