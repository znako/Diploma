import { openSSEConnection } from "@/api/utils";
import { Title } from "@/shared/components/Title";
import { TASK_ID_LOCAL_STORAGE_KEY } from "@/shared/consts";
import { useAppDispatch, useAppSelector } from "@/shared/hooks";
import { Button, Flex, Progress, Text } from "@gravity-ui/uikit";
import cn from "classnames";
import { useEffect, useState } from "react";
import { MAP_VAR_NUMBER_TO_NAME } from "../TaskCreator/consts";
import { OVERFLOW_VARS_NUMBER } from "./consts";
import { selectSolutionData, selectSolutionIsLoading } from "./selectors";
import { taskSolutionActions } from "./slice";
import styles from "./styles.module.css";

export const TaskSolution = () => {
  const [showMore, setShowMore] = useState(false);
  const dispatch = useAppDispatch();
  const data = useAppSelector(selectSolutionData);
  const isLoading = useAppSelector(selectSolutionIsLoading);
  const { setIsLoading } = taskSolutionActions;

  useEffect(() => {
    const taskId = localStorage.getItem(TASK_ID_LOCAL_STORAGE_KEY);
    if (taskId) {
      dispatch(setIsLoading(true));
      openSSEConnection(taskId, dispatch);
    }
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <Progress
          className={styles.progress}
          text="Задача решается..."
          theme="info"
          value={80}
          loading={true}
        />
      );
    }
    if (!data) {
      return (
        <Text
          variant="body-2"
          color="secondary"
          className={styles.emptyMessage}
        >
          Заполните данные по задаче и здесь появится решение
        </Text>
      );
    }
    return (
      <Flex direction="column" gap={5}>
        <Text variant="header-1">{data.message}</Text>
        {data.objective !== undefined && (
          <Text variant="header-1">Значение функции: {data.objective}</Text>
        )}
        {data.variable_values && (
          <Flex direction={"column"} gap={2}>
            <Text variant="header-1">Значение переменных:</Text>
            <Flex
              direction={"column"}
              className={cn(styles.variablesContainer, {
                [styles.hide]: !showMore,
              })}
            >
              {Object.entries(data.variable_values).map(
                ([index, value], _, varsArray) => (
                  <Text variant="header-1" key={`variable_values_${index}`}>
                    {varsArray.length >
                    Object.entries(MAP_VAR_NUMBER_TO_NAME).length
                      ? index
                      : MAP_VAR_NUMBER_TO_NAME[index]}
                    : {value}
                  </Text>
                )
              )}
              {Object.entries(data.variable_values).length >
                OVERFLOW_VARS_NUMBER &&
                !showMore && (
                  <Button
                    className={styles.toggleShowMoreButton}
                    onClick={() => setShowMore(true)}
                  >
                    Показать все
                  </Button>
                )}
              {showMore && (
                <Button
                  className={styles.toggleShowMoreButton}
                  onClick={() => setShowMore(false)}
                >
                  Скрыть
                </Button>
              )}
            </Flex>
          </Flex>
        )}
      </Flex>
    );
  };

  return (
    <Flex className={styles.TaskSolution} direction={"column"} gap={8}>
      <Title title="Решение задачи" />
      {renderContent()}
    </Flex>
  );
};
