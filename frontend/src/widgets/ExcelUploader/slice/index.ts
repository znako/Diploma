import { SolverEnum } from "@/shared/types";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

export interface ExcelUploaderState {
  value: string | null;
  solver: SolverEnum;

  disableUploadButton: boolean | null;
}

const initialState: ExcelUploaderState = {
  value: null,
  solver: SolverEnum.GLPK,

  disableUploadButton: false,
};

export const excelUploaderSlice = createSlice({
  name: "excelUploader",
  initialState,
  reducers: {
    setValue: (state, action: PayloadAction<string | null>) => {
      state.value = action.payload;
    },
    setSolver: (state, action: PayloadAction<SolverEnum>) => {
      state.solver = action.payload;
    },

    setDisableUploadButton: (state, action: PayloadAction<boolean>) => {
      state.disableUploadButton = action.payload;
    },

    setInitialState: () => initialState,
  },
});

export const { actions: excelUploaderActions, reducer: excelUploaderReducer } =
  excelUploaderSlice;
