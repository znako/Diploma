import { AppDispatch } from "@/configs/store";
import { toaster } from "@/shared/components/Toaster";
import {
  BASE_TOASTER_ERROR_MESSAGE,
  TASK_ID_LOCAL_STORAGE_KEY,
} from "@/shared/consts";
import { excelUploaderActions } from "@/widgets/ExcelUploader";
import { taskCreatorActions } from "@/widgets/TaskCreator";
import { taskSolutionActions } from "@/widgets/TaskSolution";
import { SolutionResponse } from "@/widgets/TaskSolution/types";
import { BASE_URL } from "./consts";

let currentSSEConnection: EventSource;

export const closeCurrentSSEConnection = () => {
  if (currentSSEConnection) {
    currentSSEConnection.close();
  }
};

export const openSSEConnection = (taskId: string, dispatch: AppDispatch) => {
  currentSSEConnection = new EventSource(`${BASE_URL}/task_progress/${taskId}`);
  dispatch(taskCreatorActions.setDisableUploadButton(true));
  dispatch(excelUploaderActions.setDisableUploadButton(true));
  currentSSEConnection.onmessage = (event) => {
    const message = event.data;
    console.log("Получено SSE сообщение", message);
    // Если получили финальный ответ, который приходит в виде корректного JSON,
    // то завершаем процесс.
    try {
      // Попытка распарсить сообщение как JSON – если получится, то это финальный результат.
      const payload = JSON.parse(message) as SolutionResponse;
      // Извлекаем решение и base64 строку Excel-файла с условиями.
      const solution = payload.solution;
      const base64Excel = payload.conditions_excel;
      const solver = payload.solver;
      const solveDuration = payload.solve_duration;

      // Декодируем base64 в бинарные данные и создаём Blob. Тип для .xlsx:
      // 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      const binaryString = atob(base64Excel);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Генерируем URL для скачивания или отображения файла
      const excelUrl = URL.createObjectURL(blob);
      dispatch(taskSolutionActions.setSolution(solution));
      dispatch(taskSolutionActions.setCondition(excelUrl));
      dispatch(taskSolutionActions.setSolver(solver));
      dispatch(taskSolutionActions.setSolveDuration(solveDuration));
      dispatch(taskSolutionActions.setIsLoading(false));
      dispatch(taskCreatorActions.setDisableUploadButton(false));
      dispatch(excelUploaderActions.setDisableUploadButton(false));
      closeCurrentSSEConnection();
    } catch {
      // Если не JSON, то, скорее всего, это промежуточное сообщение (лог)
      // Можно проверить и, если это сообщение "[end]", закрыть соединение.
      if (message === "[end]") {
        dispatch(taskSolutionActions.setIsLoading(false));
        dispatch(taskCreatorActions.setDisableUploadButton(false));
        dispatch(excelUploaderActions.setDisableUploadButton(false));
        closeCurrentSSEConnection();
      } else if (message === "[error]") {
        dispatch(taskSolutionActions.setIsLoading(false));
        dispatch(taskCreatorActions.setDisableUploadButton(false));
        dispatch(excelUploaderActions.setDisableUploadButton(false));
        dispatch(taskSolutionActions.setInitialState());
        closeCurrentSSEConnection();
        toaster.add({
          name: "SseErrorMessage",
          title: BASE_TOASTER_ERROR_MESSAGE,
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
      title: BASE_TOASTER_ERROR_MESSAGE,
      theme: "danger",
    });
    dispatch(taskSolutionActions.setIsLoading(false));
    dispatch(taskCreatorActions.setDisableUploadButton(false));
    dispatch(excelUploaderActions.setDisableUploadButton(false));
    closeCurrentSSEConnection();
  };
};
