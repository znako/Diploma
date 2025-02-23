import { RootState } from "configs/store/store";

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
