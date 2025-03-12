import { useSolveMilpExcelMutation } from "@/api";
import { ErrorResponse } from "@/api/types";
import { useAppDispatch, useAppSelector } from "@/shared/hooks";
import { useToaster } from "@gravity-ui/uikit";
import { ChangeEvent, useEffect } from "react";
import { selectExcelUploaderValue } from "./selectors";
import { excelUploaderActions } from "./slice";

export const ExcelUploader = () => {
  const { add } = useToaster();
  const dispatch = useAppDispatch();
  const excelValue = useAppSelector(selectExcelUploaderValue);
  const { setValue } = excelUploaderActions;
  const [solveMilpExcel, { error }] = useSolveMilpExcelMutation();
  const onUploadFile = (value: File | undefined) => {
    if (!value) {
      return;
    }
    const formData = new FormData();

    formData.append("file", value);

    solveMilpExcel(formData);
  };

  useEffect(() => {
    if (error) {
      add({
        name: "ExcelUploaderError",
        title: (error as ErrorResponse).data.error,
        theme: "danger",
      });
    }
  }, [error, add]);

  const onChangeFileInput = (e: ChangeEvent<HTMLInputElement> | undefined) => {
    const target = e?.target;
    // dispatch(setFile(target?.files?.[0] ?? null));
    dispatch(setValue(target?.value ?? null));
    onUploadFile(target?.files?.[0]);
  };

  return (
    <input
      type="file"
      value={excelValue ?? ""}
      onChange={onChangeFileInput}
      onClick={() => dispatch(setValue(null))}
    />
  );
};
