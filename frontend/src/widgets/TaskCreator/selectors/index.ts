import { RootState } from "@/configs/store";

export const selectTaskCreatorData = (state: RootState) => state.taskCreator;

export const selectVarsCount = (state: RootState) =>
  state.taskCreator.varsCount;
export const selectConstraintsCount = (state: RootState) =>
  state.taskCreator.constraintsCount;
export const selectVarsDomain = (state: RootState) =>
  state.taskCreator.varsDomain;
export const selectObjectiveCoeffs = (state: RootState) =>
  state.taskCreator.objectiveCoeffs;
export const selectObjectiveSense = (state: RootState) =>
  state.taskCreator.objectiveSense;
export const selectConstraintsCoeffs = (state: RootState) =>
  state.taskCreator.constraintsCoeffs;
export const selectConstraintsSense = (state: RootState) =>
  state.taskCreator.constraintsSense;
export const selectConstraintsRhs = (state: RootState) =>
  state.taskCreator.constraintsRhs;

// Ошибки
export const selectObjectiveCoeffsError = (state: RootState) =>
  state.taskCreator.objectiveCoeffsError;
export const selectConstraintsCoeffsError = (state: RootState) =>
  state.taskCreator.constraintsCoeffsError;
