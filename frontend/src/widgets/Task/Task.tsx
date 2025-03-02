import { Flex } from "@gravity-ui/uikit";
import { CreatingTask, TaskSolution } from "./components/";

export const Task = () => {
  return (
    <Flex>
      <CreatingTask />
      <TaskSolution />
    </Flex>
  );
};
