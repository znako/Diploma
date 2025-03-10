import { useSolveMilpExcelMutation } from "@/api";
import { useAppDispatch, useAppSelector } from "@/shared/hooks";
import { ChangeEvent } from "react";
import { selectExcelUploaderValue } from "./selectors";
import { excelUploaderActions } from "./slice";

export const ExcelUploader = () => {
  const dispatch = useAppDispatch();
  const excelValue = useAppSelector(selectExcelUploaderValue);
  const { setValue } = excelUploaderActions;
  const [solveMilpExcel] = useSolveMilpExcelMutation();
  const onUploadFile = (value: File | undefined) => {
    if (!value) {
      return;
    }
    const formData = new FormData();

    formData.append("file", value);

    solveMilpExcel(formData);
  };
  const onChangeFileInput = (e: ChangeEvent<HTMLInputElement> | undefined) => {
    const target = e?.target;
    // dispatch(setFile(target?.files?.[0] ?? null));
    dispatch(setValue(target?.value ?? null));
    onUploadFile(target?.files?.[0]);
  };

  return (
    <input type="file" value={excelValue ?? ""} onChange={onChangeFileInput} />
  );
};
