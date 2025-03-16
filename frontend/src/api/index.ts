import { TASK_ID_LOCAL_STORAGE_KEY } from "@/shared/consts";
import { excelUploaderActions } from "@/widgets/ExcelUploader";
import { MilpDTO, taskCreatorActions } from "@/widgets/TaskCreator";
import { taskSolutionActions } from "@/widgets/TaskSolution";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BACKEND_URL } from "./consts";
import { SolveMilpExcelResponse, SolveMilpResponse } from "./types";
import { openSSEConnection } from "./utils";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: `${BACKEND_URL}/solve_milp` }),
  endpoints: (builder) => ({
    solveMilp: builder.mutation<SolveMilpResponse, MilpDTO>({
      query: (data) => ({
        url: "",
        method: "POST",
        body: data,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
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
          dispatch(taskSolutionActions.setInitialState());
        }
      },
    }),
  }),
});

export const { useSolveMilpMutation, useSolveMilpExcelMutation } = api;
