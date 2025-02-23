import {
  ConstraintSenseEnum,
  ObjectiveSenseEnum,
  VariablesDomainEnum,
  VariablesEnum,
} from "../types/types";

export const SELECT_VARS_COUNT_OPTIONS = [
  { value: "2", content: "2" },
  { value: "3", content: "3" },
  { value: "4", content: "4" },
];
export const DEFAULT_VARS_COUNT = 2;

export const SELECT_VAR_DOMAIN_OPTIONS: {
  value: VariablesDomainEnum;
  content: string;
}[] = [
  {
    value: VariablesDomainEnum.NON_NEGATIVE_INTEGERS,
    content: "Целочисленное, положительное",
  },
  {
    value: VariablesDomainEnum.NON_NEGATIVE_REALS,
    content: "Вещественное, положительное",
  },
  { value: VariablesDomainEnum.INTEGERS, content: "Целочисленное" },
  { value: VariablesDomainEnum.REALS, content: "Вещественное" },
  { value: VariablesDomainEnum.BINARY, content: "Булевое (0-1)" },
];

export const SELECT_OBJECTIVE_SENSE_OPTIONS: {
  value: ObjectiveSenseEnum;
  content: string;
}[] = [
  { value: ObjectiveSenseEnum.MAXIMIZE, content: "Максимизировать" },
  { value: ObjectiveSenseEnum.MINIMIZE, content: "Минимизировать" },
];

export const SELECT_CONSTRAINT_SENSE_OPTIONS: Array<{
  value: ConstraintSenseEnum;
  content: string;
}> = [
  { value: ConstraintSenseEnum.LESS_OR_EQUAL, content: "≤" },
  { value: ConstraintSenseEnum.MORE_OR_EQUAL, content: "≥" },
  { value: ConstraintSenseEnum.EQUAL, content: "=" },
];

export const MAP_VAR_NUMBER_TO_NAME: Record<string, VariablesEnum> = {
  0: VariablesEnum.X,
  1: VariablesEnum.Y,
  2: VariablesEnum.Z,
  3: VariablesEnum.V,
};
