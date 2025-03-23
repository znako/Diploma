import { VariablesEnum } from "../types";

export const SELECT_VARS_COUNT_OPTIONS = [
  { value: "2", content: "2" },
  { value: "3", content: "3" },
  { value: "4", content: "4" },
];
export const DEFAULT_VARS_COUNT = 2;

export const MAP_VAR_NUMBER_TO_NAME: Record<string, VariablesEnum> = {
  0: VariablesEnum.X,
  1: VariablesEnum.Y,
  2: VariablesEnum.Z,
  3: VariablesEnum.V,
};
