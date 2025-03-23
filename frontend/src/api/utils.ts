import { AppDispatch } from "@/configs/store";
import { toaster } from "@/shared/components/Toaster";
import { TASK_ID_LOCAL_STORAGE_KEY } from "@/shared/consts";
import { Solution, taskSolutionActions } from "@/widgets/TaskSolution";
import { BACKEND_URL } from "./consts";

let currentSSEConnection: EventSource;

export const openSSEConnection = (taskId: string, dispatch: AppDispatch) => {
  if (currentSSEConnection) {
    currentSSEConnection.close();
  }
  currentSSEConnection = new EventSource(
    `${BACKEND_URL}/task_progress/${taskId}`
  );
  currentSSEConnection.onmessage = (event) => {
    const message = event.data;
    console.log("Получено SSE сообщение", message);
    // Если получили финальный ответ, который приходит в виде корректного JSON,
    // то завершаем процесс.
    try {
      // Попытка распарсить сообщение как JSON – если получится, то это финальный результат.
      const result = JSON.parse(message) as Solution;
      dispatch(taskSolutionActions.setData(result));
      dispatch(taskSolutionActions.setIsLoading(false));
      currentSSEConnection.close();
    } catch {
      // Если не JSON, то, скорее всего, это промежуточное сообщение (лог)
      // Можно проверить и, если это сообщение "[end]", закрыть соединение.
      if (message === "[end]") {
        dispatch(taskSolutionActions.setIsLoading(false));
        currentSSEConnection.close();
      } else if (message === "[error]") {
        dispatch(taskSolutionActions.setIsLoading(false));
        currentSSEConnection.close();
        toaster.add({
          name: "SseErrorMessage",
          title: "Что-то пошло не так попробуйте снова",
          theme: "danger",
        });
        localStorage.removeItem(TASK_ID_LOCAL_STORAGE_KEY);
      } else {
        // Обновляем лог.
        console.log(message);
      }
    }
  };
  currentSSEConnection.onerror = () => {
    toaster.add({
      name: "SseError",
      title: "Что-то пошло не так попробуйте снова",
      theme: "danger",
    });
    dispatch(taskSolutionActions.setIsLoading(false));
    localStorage.removeItem(TASK_ID_LOCAL_STORAGE_KEY);
    currentSSEConnection.close();
  };
};
