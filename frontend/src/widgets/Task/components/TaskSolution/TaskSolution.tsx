import { Flex, Spin, Text } from "@gravity-ui/uikit";
import { useSolveMilpMutation } from "../../api/api";
import {
  MAP_VAR_NUMBER_TO_NAME,
  SHARED_SOLVE_MILP_FIXED_CACHE_KEY,
} from "../../consts/consts";
import { Title } from "../Title/Title";
import styles from "./styles.module.css";

export const TaskSolution = () => {
  const [, { data, isLoading }] = useSolveMilpMutation({
    fixedCacheKey: SHARED_SOLVE_MILP_FIXED_CACHE_KEY,
  });
  console.log(data, isLoading);

  const renderContent = () => {
    if (isLoading) {
      return <Spin className={styles.spinner} />;
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
            {Object.entries(data.variable_values).map(([index, value]) => (
              <Text variant="header-1" key={`variable_values_${index}`}>
                {MAP_VAR_NUMBER_TO_NAME[index]}: {value}
              </Text>
            ))}
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
