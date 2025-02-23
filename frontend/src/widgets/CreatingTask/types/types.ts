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
