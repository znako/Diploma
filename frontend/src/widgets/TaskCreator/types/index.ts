import {
  ConstraintSenseEnum,
  ObjectiveSenseEnum,
  SolverEnum,
  VariablesDomainEnum,
} from "@/shared/types";

export enum VariablesEnum {
  X = "x",
  Y = "y",
  Z = "z",
  V = "v",
}

export type MilpDTO = {
  objective: {
    coefficients: number[];
    sense: ObjectiveSenseEnum;
  };
  variable_domains: VariablesDomainEnum[];
  constraints: {
    coefficients: number[];
    rhs: number;
    sense: ConstraintSenseEnum;
  }[];
  solver: SolverEnum;
};
