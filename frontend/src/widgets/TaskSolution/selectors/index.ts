import { RootState } from "@/configs/store/store";

export const selectSolutionData = (state: RootState) => state.taskSolution.data;
export const selectSolutionIsLoading = (state: RootState) =>
  state.taskSolution.isLoading;
