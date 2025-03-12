import { excelUploaderActions } from "@/widgets/ExcelUploader";
import { MilpDTO, taskCreatorActions } from "@/widgets/TaskCreator";
import { Solution, taskSolutionActions } from "@/widgets/TaskSolution";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "http://127.0.0.1:5000/solve_milp" }),
  endpoints: (builder) => ({
    solveMilp: builder.mutation<Solution, MilpDTO>({
      query: (data) => ({
        url: "",
        method: "POST",
        body: data,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(excelUploaderActions.setInitialState());
        dispatch(taskSolutionActions.setLoading(true));
        try {
          const { data } = await queryFulfilled;
          dispatch(taskSolutionActions.setData(data));
          dispatch(taskSolutionActions.setLoading(false));
        } catch {
          dispatch(taskSolutionActions.setInitialState());
        }
      },
    }),
    solveMilpExcel: builder.mutation<Solution, FormData>({
      query: (data) => {
        console.log(data);
        return { url: "/excel", method: "POST", body: data };
      },
      // При вызове данного эндпоинта tag 'SolveMilpData' инвалидируется, что приведёт к сбросу кэша
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(taskCreatorActions.setInitialState());
        dispatch(taskSolutionActions.setLoading(true));
        try {
          const { data } = await queryFulfilled;
          dispatch(taskSolutionActions.setData(data));
          dispatch(taskSolutionActions.setLoading(false));
        } catch {
          dispatch(taskSolutionActions.setInitialState());
        }
      },
    }),
  }),
});

export const { useSolveMilpMutation, useSolveMilpExcelMutation } = api;
