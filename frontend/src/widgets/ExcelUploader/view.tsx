import { useSolveMilpExcelMutation } from "@/api";
import { ErrorResponse } from "@/api/types";
import { Title } from "@/shared/components/Title";
import {
  SELECT_CONSTRAINT_SENSE_OPTIONS,
  SELECT_OBJECTIVE_SENSE_OPTIONS,
  SELECT_VAR_DOMAIN_OPTIONS,
} from "@/shared/consts";
import { useAppDispatch, useAppSelector } from "@/shared/hooks";
import { Button, Card, Flex, Modal, Text, useToaster } from "@gravity-ui/uikit";
import { ChangeEvent, useEffect, useState } from "react";
import { selectExcelUploaderValue } from "./selectors";
import { excelUploaderActions } from "./slice";
import styles from "./styles.module.css";

export const ExcelUploader = () => {
  const { add } = useToaster();
  const dispatch = useAppDispatch();
  const { setValue } = excelUploaderActions;
  const excelValue = useAppSelector(selectExcelUploaderValue);
  const [solveMilpExcel, { error }] = useSolveMilpExcelMutation();
  const [openModal, setOpenModal] = useState(false);

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
        title:
          (error as ErrorResponse)?.data?.error ??
          "Что-то пошло не так, попробуйте еще раз",
        theme: "danger",
      });
    }
  }, [error, add]);

  const onChangeFileInput = (e: ChangeEvent<HTMLInputElement> | undefined) => {
    const target = e?.target;
    // dispatch(setFile(target?.files?.[0] ?? null));
    dispatch(setValue(target?.value ?? null));
    onUploadFile(target?.files?.[0]);
    setOpenModal(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpenModal(true)}
        view="outlined-action"
        size="l"
      >
        Загрузить файлом
      </Button>
      <Modal
        contentClassName={styles.modal}
        open={openModal}
        onOpenChange={setOpenModal}
        keepMounted
        disableBodyScrollLock={!openModal}
      >
        <Flex gap={5} direction="column">
          <Title title="Загрузка задачи через файл" variant="header-1" />
          <Card
            className={styles.card}
            theme="info"
            type="selection"
            view="filled"
          >
            <Text variant="body-2">
              Сервис поддерживает загрузку условий задачи через файл Excel.
              <br />
              Файл должен соответствовать следующим условиям:
              <ul>
                <li>Формат файла - .xlsx</li>
                <li>
                  Excel файл соответствует шаблону.{" "}
                  <a href="../../../public/Шаблон.xlsx" download="Шаблон.xlsx">
                    Скачать шаблон
                  </a>
                </li>
                <li>
                  В первом столбце количество переменных должно быть целым
                  числом
                </li>
                <li>
                  В столбце "Указание на целочисленность" количество строк
                  должно соответствовать количеству переменных. Возможны
                  следущие значения:
                  <ul>
                    {SELECT_VAR_DOMAIN_OPTIONS.map((domain) => (
                      <li key={domain.value}>
                        {domain.value} - {domain.content}
                      </li>
                    ))}
                  </ul>
                </li>
                <li>
                  В столбце "Коэффициенты функции" количество строк должно
                  соответствовать количеству переменных
                </li>
                <li>
                  В столбце "Вид оптимизации" возможно одно из следующих
                  значений:
                  <ul>
                    {SELECT_OBJECTIVE_SENSE_OPTIONS.map((sense) => (
                      <li key={sense.value}>
                        {sense.value} - {sense.content}
                      </li>
                    ))}
                  </ul>
                </li>
                <li>
                  В столбце "Количество ограничений" должно быть целое число.
                  Далее должно быть столько же столбцов "Коэффициенты
                  ограничения i", "Правая часть ограничения i", "Знак
                  ограничения i" (где i - номер ограничения). Если в столбце
                  количество ограничений равно 0, то следующие за ним столбцы
                  можно не указывать.
                </li>
                <li>
                  В столбце "Коэффициенты ограничения i" количество строк должно
                  соответствовать количеству переменных
                </li>
                <li>
                  В столбце "Правая часть ограничения i" должно находится одно
                  число
                </li>
                <li>
                  В столбце "Знак ограничения i" может находится одно из
                  следующих значений:{" "}
                  <ul>
                    {SELECT_CONSTRAINT_SENSE_OPTIONS.map((sense) => (
                      <li key={sense.value}>{sense.value}</li>
                    ))}
                  </ul>
                </li>
              </ul>
              <a href="../../../public/Пример.xlsx" download="Пример.xlsx">
                Пример задачи
              </a>
            </Text>
          </Card>
          <input
            type="file"
            value={excelValue ?? ""}
            onChange={onChangeFileInput}
            onClick={() => dispatch(setValue(null))}
            accept=".xlsx"
          />
        </Flex>
      </Modal>
    </>
  );
};
