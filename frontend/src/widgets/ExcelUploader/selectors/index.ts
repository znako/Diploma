import { RootState } from "@/configs/store";

export const selectExcelUploaderValue = (state: RootState) =>
  state.excelUploader.value;
export const selectExcelUploaderFile = (state: RootState) =>
  state.excelUploader.file;

export const selectDisableUploadButton = (state: RootState) =>
  state.taskCreator.disableUploadButton;
