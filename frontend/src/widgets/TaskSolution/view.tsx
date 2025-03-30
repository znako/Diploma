import { useCancelTaskMutation } from "@/api";
import { openSSEConnection } from "@/api/utils";
import { Title } from "@/shared/components/Title";
import { TASK_ID_LOCAL_STORAGE_KEY } from "@/shared/consts";
import { useAppDispatch, useAppSelector } from "@/shared/hooks";
import { Button, Flex, Progress, Select, Text } from "@gravity-ui/uikit";
import cn from "classnames";
import { useEffect, useState } from "react";
import { MAP_VAR_NUMBER_TO_NAME } from "../TaskCreator/consts";
import {
  FRACTION_DIGITS_DEFAULT_VALUE,
  FRACTION_DIGITS_OPTIONS,
  OVERFLOW_VARS_NUMBER,
  PROGRESS_BAR_VALUE,
} from "./consts";
import {
  selectSolutionConditions,
  selectSolutionData,
  selectSolutionIsLoading,
} from "./selectors";
import { taskSolutionActions } from "./slice";
import styles from "./styles.module.css";

export const TaskSolution = () => {
  const [maximumFractionDigits, setMaximumFractionDigits] = useState<number>(
    Number(FRACTION_DIGITS_DEFAULT_VALUE[0])
  );
  const [showMore, setShowMore] = useState(false);
  const dispatch = useAppDispatch();
  const solution = useAppSelector(selectSolutionData);
  const conditions = useAppSelector(selectSolutionConditions);
  const isLoading = useAppSelector(selectSolutionIsLoading);
  const { setIsLoading } = taskSolutionActions;
  const [cancelTask] = useCancelTaskMutation();

  useEffect(() => {
    const taskId = localStorage.getItem(TASK_ID_LOCAL_STORAGE_KEY);
    if (taskId) {
      dispatch(setIsLoading(true));
      openSSEConnection(taskId, dispatch);
    }
  }, []);

  useEffect(() => {
    setShowMore(false);
  }, [solution]);

  const cancelTaskCallback = () => {
    const taskId = localStorage.getItem(TASK_ID_LOCAL_STORAGE_KEY);
    if (taskId) {
      cancelTask(taskId);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <Flex gap={5} justifyContent="center" alignItems="center">
          <Progress
            className={styles.progress}
            text="Задача решается..."
            theme="info"
            value={PROGRESS_BAR_VALUE}
            loading={true}
          />
          <Button
            className={styles.cancelTaskButton}
            view="outlined-danger"
            onClick={cancelTaskCallback}
          >
            Отменить решение
          </Button>
        </Flex>
      );
    }
    if (!solution) {
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
        {(solution?.objective !== undefined || !!solution?.variable_values) && (
          <Flex gap={2} alignItems={"center"}>
            <Text variant="body-2" color="secondary">
              Количество знаков после запятой
            </Text>
            <Select
              options={FRACTION_DIGITS_OPTIONS}
              defaultValue={FRACTION_DIGITS_DEFAULT_VALUE}
              onUpdate={(value) => setMaximumFractionDigits(Number(value[0]))}
            />
          </Flex>
        )}
        {!!conditions && (
          <Text variant="header-1">
            <a href={conditions}>Условие задачи</a>
          </Text>
        )}
        <Text variant="header-1">{solution.message}</Text>
        {solution.objective !== undefined && (
          <Text variant="header-1">
            Значение функции:{" "}
            {solution.objective.toLocaleString(undefined, {
              maximumFractionDigits: Number(maximumFractionDigits),
            })}
          </Text>
        )}
        {solution.variable_values && (
          <Flex direction={"column"} gap={2}>
            <Text variant="header-1">Значение переменных:</Text>
            <Flex
              direction={"column"}
              className={cn(styles.variablesContainer, {
                [styles.hide]: !showMore,
              })}
            >
              {Object.entries(solution.variable_values).map(
                ([index, value], _, varsArray) => (
                  <Text variant="header-1" key={`variable_values_${index}`}>
                    {varsArray.length >
                    Object.entries(MAP_VAR_NUMBER_TO_NAME).length
                      ? index
                      : MAP_VAR_NUMBER_TO_NAME[index]}
                    :{" "}
                    {value.toLocaleString(undefined, {
                      maximumFractionDigits: Number(maximumFractionDigits),
                    })}
                  </Text>
                )
              )}
              {Object.entries(solution.variable_values).length >
                OVERFLOW_VARS_NUMBER &&
                (!showMore ? (
                  <Button
                    className={styles.toggleShowMoreButton}
                    onClick={() => setShowMore(true)}
                  >
                    Показать все
                  </Button>
                ) : (
                  showMore && (
                    <Button
                      className={styles.toggleShowMoreButton}
                      onClick={() => setShowMore(false)}
                    >
                      Скрыть
                    </Button>
                  )
                ))}
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
