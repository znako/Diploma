export type Solution = {
  /* Тип полученного решения optimal, infeasible, unbounded и др.  */
  termination_condition: string;
  /* Сообщение, которое описывает тип полученного решения*/
  message: string;
  /* Значение целевой функции */
  objective?: number;
  /* Значения переменных, где ключ - это индекс переменной в строковом формате */
  variable_values?: Record<string, number>;
};

export type SolutionResponse = {
  solution: Solution;
  /* Base64 строка, которая хранит условия задачи в excel формате */
  conditions_excel: string;
};
