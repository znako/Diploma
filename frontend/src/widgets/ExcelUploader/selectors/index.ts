import { RootState } from "@/configs/store/store";

export const selectExcelUploaderValue = (state: RootState) =>
  state.excelUploader.value;
export const selectExcelUploaderFile = (state: RootState) =>
  state.excelUploader.file;
