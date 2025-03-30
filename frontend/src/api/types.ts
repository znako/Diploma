export type ErrorResponse = {
  status: number;
  data: {
    error: string;
  };
};

export type SolveMilpResponse = { task_id: string };
export type SolveMilpExcelResponse = { task_id: string };

export type CancelTaskResponse = { message: string };
