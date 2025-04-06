import {
  ConstraintSenseEnum,
  ObjectiveSenseEnum,
  SolverEnum,
  VariablesDomainEnum,
} from "../types";

export const TASK_ID_LOCAL_STORAGE_KEY = "taskId";

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

export const BASE_TOASTER_ERROR_MESSAGE =
  "Что-то пошло не так, попробуйте еще раз";

export const SELECT_SOLVER_OPTIONS: Array<{
  value: SolverEnum;
  content: string;
}> = [
  { value: SolverEnum.GLPK, content: "glpk" },
  { value: SolverEnum.CBC, content: "coin-or" },
  { value: SolverEnum.SCIP, content: "scip" },
];
