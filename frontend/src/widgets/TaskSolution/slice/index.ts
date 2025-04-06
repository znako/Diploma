import { SolverEnum } from "@/shared/types";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { Solution } from "../types";

export interface TaskSolutionState {
  solution: Solution | null;
  conditions: string | null;
  solver: SolverEnum | null;
  solveDuration: number | null;
  isLoading: boolean | null;
}

const initialState: TaskSolutionState = {
  solution: null,
  conditions: null,
  solver: null,
  solveDuration: null,
  isLoading: null,
};

export const taskSolutionSlice = createSlice({
  name: "taskSolution",
  initialState,
  reducers: {
    setSolution: (state, action: PayloadAction<Solution>) => {
      state.solution = action.payload;
    },
    setCondition: (state, action: PayloadAction<string>) => {
      state.conditions = action.payload;
    },
    setSolver: (state, action: PayloadAction<SolverEnum>) => {
      state.solver = action.payload;
    },
    setSolveDuration: (state, action: PayloadAction<number>) => {
      state.solveDuration = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setInitialState: () => initialState,
  },
});

export const { actions: taskSolutionActions, reducer: taskSolutionReducer } =
  taskSolutionSlice;
