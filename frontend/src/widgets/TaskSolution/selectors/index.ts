import { RootState } from "@/configs/store";

export const selectSolutionData = (state: RootState) =>
  state.taskSolution.solution;
export const selectSolutionConditions = (state: RootState) =>
  state.taskSolution.conditions;
export const selectSolutionIsLoading = (state: RootState) =>
  state.taskSolution.isLoading;
