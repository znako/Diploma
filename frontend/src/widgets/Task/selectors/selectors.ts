import { RootState } from "configs/store/store";

export const selectCreatingTaskData = (state: RootState) => state.creatingTask;

export const selectVarsCount = (state: RootState) =>
  state.creatingTask.varsCount;
export const selectConstraintsCount = (state: RootState) =>
  state.creatingTask.constraintsCount;
export const selectVarsDomain = (state: RootState) =>
  state.creatingTask.varsDomain;
export const selectObjectiveCoeffs = (state: RootState) =>
  state.creatingTask.objectiveCoeffs;
export const selectObjectiveSense = (state: RootState) =>
  state.creatingTask.objectiveSense;
export const selectConstraintsCoeffs = (state: RootState) =>
  state.creatingTask.constraintsCoeffs;
export const selectConstraintsSense = (state: RootState) =>
  state.creatingTask.constraintsSense;
export const selectConstraintsRhs = (state: RootState) =>
  state.creatingTask.constraintsRhs;

// Ошибки
export const selectObjectiveCoeffsError = (state: RootState) =>
  state.creatingTask.objectiveCoeffsError;
export const selectConstraintsCoeffsError = (state: RootState) =>
  state.creatingTask.constraintsCoeffsError;
