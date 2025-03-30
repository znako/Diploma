import { toaster } from "@/shared/components/Toaster";
import {
  BASE_TOASTER_ERROR_MESSAGE,
  TASK_ID_LOCAL_STORAGE_KEY,
} from "@/shared/consts";
import { excelUploaderActions } from "@/widgets/ExcelUploader";
import { MilpDTO, taskCreatorActions } from "@/widgets/TaskCreator";
import { taskSolutionActions } from "@/widgets/TaskSolution";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "./consts";
import {
  CancelTaskResponse,
  ErrorResponse,
  SolveMilpExcelResponse,
  SolveMilpResponse,
} from "./types";
import { closeCurrentSSEConnection, openSSEConnection } from "./utils";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  endpoints: (builder) => ({
    solveMilp: builder.mutation<SolveMilpResponse, MilpDTO>({
      query: (data) => ({
        url: "",
        method: "POST",
        body: data,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(taskCreatorActions.setDisableUploadButton(true));
        dispatch(excelUploaderActions.setDisableUploadButton(true));
        dispatch(excelUploaderActions.setInitialState());
        dispatch(taskSolutionActions.setIsLoading(true));
        try {
          // Получаем ответ от бекенда – он должен вернуть { task_id: string }
          const { data } = await queryFulfilled;
          const taskId = data.task_id;
          // Сохраняем taskId в localStorage
          localStorage.setItem(TASK_ID_LOCAL_STORAGE_KEY, taskId);

          // Открываем SSE соединение для получения прогресса по задаче.
          openSSEConnection(taskId, dispatch);
        } catch {
          dispatch(taskCreatorActions.setDisableUploadButton(false));
          dispatch(excelUploaderActions.setDisableUploadButton(false));
          localStorage.removeItem(TASK_ID_LOCAL_STORAGE_KEY);
          dispatch(taskSolutionActions.setInitialState());
        }
      },
    }),
    solveMilpExcel: builder.mutation<SolveMilpExcelResponse, FormData>({
      query: (data) => {
        console.log("Отправляем Excel данные:", data);
        return { url: "/excel", method: "POST", body: data };
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(taskCreatorActions.setDisableUploadButton(true));
        dispatch(excelUploaderActions.setDisableUploadButton(true));
        dispatch(taskCreatorActions.setInitialState());
        dispatch(taskSolutionActions.setIsLoading(true));
        try {
          // Получаем ответ от бекенда – он должен вернуть { task_id: string }
          const { data } = await queryFulfilled;
          const taskId = data.task_id;
          // Сохраняем taskId в localStorage
          localStorage.setItem(TASK_ID_LOCAL_STORAGE_KEY, taskId);

          // Открываем SSE соединение для получения прогресса по задаче.
          openSSEConnection(taskId, dispatch);
        } catch {
          dispatch(taskCreatorActions.setDisableUploadButton(false));
          dispatch(excelUploaderActions.setDisableUploadButton(false));
          localStorage.removeItem(TASK_ID_LOCAL_STORAGE_KEY);
          dispatch(taskSolutionActions.setInitialState());
        }
      },
    }),
    cancelTask: builder.mutation<CancelTaskResponse, string>({
      query: (taskId) => {
        return { url: `/cancel_task/${taskId}`, method: "POST" };
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        closeCurrentSSEConnection();
        dispatch(taskCreatorActions.setDisableUploadButton(false));
        dispatch(excelUploaderActions.setDisableUploadButton(false));
        dispatch(taskSolutionActions.setInitialState());
        try {
          const { data } = await queryFulfilled;
          toaster.add({
            name: "CancelTaskSuccess",
            title: data.message,
            theme: "success",
          });
        } catch (e) {
          toaster.add({
            name: "CancelTaskError",
            title:
              (e as ErrorResponse)?.data?.error || BASE_TOASTER_ERROR_MESSAGE,
            theme: "danger",
          });
        } finally {
          localStorage.removeItem(TASK_ID_LOCAL_STORAGE_KEY);
        }
      },
    }),
  }),
});

export const {
  useSolveMilpMutation,
  useSolveMilpExcelMutation,
  useCancelTaskMutation,
} = api;
