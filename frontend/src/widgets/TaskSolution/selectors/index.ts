import { RootState } from "@/configs/store";

export const selectSolutionData = (state: RootState) =>
  state.taskSolution.solution;
export const selectSolutionConditions = (state: RootState) =>
  state.taskSolution.conditions;
export const selectSolutionSolver = (state: RootState) =>
  state.taskSolution.solver;
export const selectSolutionSolveDuration = (state: RootState) =>
  state.taskSolution.solveDuration;
export const selectSolutionIsLoading = (state: RootState) =>
  state.taskSolution.isLoading;
