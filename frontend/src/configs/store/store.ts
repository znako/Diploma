import { creatingTaskReducer } from "@/widgets/CreatingTask";
import { configureStore } from "@reduxjs/toolkit";

export const store = configureStore({
  reducer: {
    creatingTask: creatingTaskReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
