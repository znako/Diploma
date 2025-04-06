import { RootState } from "@/configs/store";

export const selectExcelUploaderValue = (state: RootState) =>
  state.excelUploader.value;
export const selectSolver = (state: RootState) => state.excelUploader.solver;

export const selectDisableUploadButton = (state: RootState) =>
  state.taskCreator.disableUploadButton;
