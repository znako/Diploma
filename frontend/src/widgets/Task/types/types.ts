export type Variables = {
  name: VariablesEnum;
  domain: VariablesDomainEnum;
}[];

export enum VariablesEnum {
  X = "x",
  Y = "y",
  Z = "z",
  V = "v",
}

export enum VariablesDomainEnum {
  NON_NEGATIVE_INTEGERS = "NonNegativeIntegers",
  NON_NEGATIVE_REALS = "NonNegativeReals",
  INTEGERS = "Integers",
  REALS = "Reals",
  BINARY = "Binary",
}

export enum ObjectiveSenseEnum {
  MAXIMIZE = "maximize",
  MINIMIZE = "minimize",
}

export enum ConstraintSenseEnum {
  LESS_OR_EQUAL = "<=",
  MORE_OR_EQUAL = "=>",
  EQUAL = "=",
}

export type MilpDTO = {
  objective: {
    coefficients: number[];
    sense: ObjectiveSenseEnum;
  };
  variables: Variables;
  constraints: {
    coefficients: number[];
    rhs: number;
    sense: ConstraintSenseEnum;
  }[];
};

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
