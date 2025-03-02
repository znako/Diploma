import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { MilpDTO, Solution } from "../types/types";

// Define a service using a base URL and expected endpoints
export const creatingTaskApi = createApi({
  reducerPath: "creatingTaskApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://127.0.0.1:5000" }),
  endpoints: (builder) => ({
    solveMilp: builder.mutation<Solution, MilpDTO>({
      query: (data) => ({
        url: `/solve_milp`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useSolveMilpMutation } = creatingTaskApi;
