import { api } from "@/api";
import { excelUploaderReducer } from "@/widgets/ExcelUploader";
import { taskCreatorReducer } from "@/widgets/TaskCreator";
import { taskSolutionReducer } from "@/widgets/TaskSolution";
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

export const store = configureStore({
  reducer: {
    taskCreator: taskCreatorReducer,
    taskSolution: taskSolutionReducer,
    excelUploader: excelUploaderReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
