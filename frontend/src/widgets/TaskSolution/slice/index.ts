import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { Solution } from "../types";

export interface TaskSolutionState {
  solution: Solution | null;
  conditions: string | null;
  isLoading: boolean | null;
}

const initialState: TaskSolutionState = {
  solution: null,
  conditions: null,
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
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setInitialState: () => initialState,
  },
});

export const { actions: taskSolutionActions, reducer: taskSolutionReducer } =
  taskSolutionSlice;
