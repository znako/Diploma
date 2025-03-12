import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { Solution } from "../types";

export interface TaskSolutionState {
  data: Solution | null;
  isLoading: boolean | null;
}

const initialState: TaskSolutionState = {
  data: null,
  isLoading: null,
};

export const taskSolutionSlice = createSlice({
  name: "taskSolution",
  initialState,
  reducers: {
    setData: (state, action: PayloadAction<Solution>) => {
      state.data = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setInitialState: () => initialState,
  },
});

export const { actions: taskSolutionActions, reducer: taskSolutionReducer } =
  taskSolutionSlice;
