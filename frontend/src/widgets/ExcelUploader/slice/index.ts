import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

export interface ExcelUploaderState {
  value: string | null;
  file: File | null;

  disableUploadButton: boolean | null;
}

const initialState: ExcelUploaderState = {
  value: null,
  file: null,

  disableUploadButton: false,
};

export const excelUploaderSlice = createSlice({
  name: "excelUploader",
  initialState,
  reducers: {
    setValue: (state, action: PayloadAction<string | null>) => {
      state.value = action.payload;
    },
    setFile: (state, action: PayloadAction<File | null>) => {
      state.file = action.payload;
    },

    setDisableUploadButton: (state, action: PayloadAction<boolean>) => {
      state.disableUploadButton = action.payload;
    },

    setInitialState: () => initialState,
  },
});

export const { actions: excelUploaderActions, reducer: excelUploaderReducer } =
  excelUploaderSlice;
