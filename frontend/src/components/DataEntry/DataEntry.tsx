import { Button, Flex, Select, Text, TextInput } from "@gravity-ui/uikit";
import { useMemo, useState } from "react";

import "./styles.css";

const SELECT_VARS_COUNT_OPTIONS = [
  { value: "2", content: "2" },
  { value: "3", content: "3" },
  { value: "4", content: "4" },
];
const DEFAULT_VARS_COUNT = ["2"];

const SELECT_VAR_DOMAIN_OPTIONS = [
  { value: "NonNegativeIntegers", content: "Целочисленное, положительное" },
  { value: "NonNegativeReals", content: "Вещественное, положительное" },
  { value: "Integers", content: "Целочисленное" },
  { value: "Reals", content: "Вещественное" },
  { value: "Binary", content: "Булевое (0-1)" },
];
const DEFAULT_VAR_DOMAIN_COUNT = ["NonNegativeIntegers"];

const SELECT_OBJECTIVE_SENSE_OPTIONS = [
  { value: "maximize", content: "Максимизировать" },
  { value: "minimize", content: "Минимизировать" },
];
const DEFAULT_OBJECTIVE_SENSE_COUNT = ["maximize"];

const SELECT_CONSTRAINT_SENSE_OPTIONS = [
  { value: "<=", content: "≤" },
  { value: "=>", content: "≥" },
  { value: "=", content: "=" },
];
const DEFAULT_CONSTRAINT_SENSE_COUNT = ["<="];

const MAP_VAR_NUMBER_TO_NAME: Record<string, string> = {
  "0": "x",
  "1": "y",
  "2": "z",
  "3": "v",
};

export const DataEntry = () => {
  const [varsCount, setVarsCount] = useState(Number(DEFAULT_VARS_COUNT[0]));
  const [constraintsCount, setConstraintsCount] = useState(
    Number(DEFAULT_VARS_COUNT[0])
  );
  const varsArray = useMemo(
    () =>
      Array(varsCount)
        .fill(0)
        .map((_, i) => i),
    [varsCount]
  );
  const constraintsArray = useMemo(
    () =>
      Array(constraintsCount)
        .fill(0)
        .map((_, i) => i),
    [constraintsCount]
  );

  return (
    <Flex direction={"column"} gap={5}>
      <Flex gap={2}>
        <Text variant="header-1">Количество переменных</Text>
        <Select
          options={SELECT_VARS_COUNT_OPTIONS}
          defaultValue={DEFAULT_VARS_COUNT}
          onUpdate={(value) => setVarsCount(Number(value[0]))}
        />
      </Flex>
      <Flex gap={2} direction={"column"}>
        <Text variant="header-1">Указание на целочисленность</Text>
        <Flex direction={"row"} gap={2}>
          {varsArray.map((varNumber) => (
            <Select
              key={`domain_${varNumber}`}
              options={SELECT_VAR_DOMAIN_OPTIONS}
              defaultValue={DEFAULT_VAR_DOMAIN_COUNT}
              label={`${MAP_VAR_NUMBER_TO_NAME[String(varNumber)]} - `}
            />
          ))}
        </Flex>
      </Flex>
      <Flex gap={2} direction="column">
        <Text variant="header-1">Линейная функция</Text>
        <Flex gap={3}>
          <Flex gap={2}>
            {varsArray.map((varNumber) => (
              <Flex gap={1} key={`objective_${varNumber}`} alignItems="center">
                <TextInput
                  className="input"
                  placeholder={String(
                    (varNumber + 1) * (varNumber % 2 === 0 ? 1 : -1)
                  )}
                />
                <Text variant="body-3">
                  {MAP_VAR_NUMBER_TO_NAME[String(varNumber)]}
                </Text>
                {varNumber !== varsCount - 1 ? (
                  <Text variant="body-3" className="plus">
                    +
                  </Text>
                ) : null}
              </Flex>
            ))}
          </Flex>
          <Flex>
            <Select
              options={SELECT_OBJECTIVE_SENSE_OPTIONS}
              defaultValue={DEFAULT_OBJECTIVE_SENSE_COUNT}
            />
          </Flex>
        </Flex>
      </Flex>
      <Flex gap={2} direction="column">
        <Text variant="header-1">Линейные ограничения</Text>
        <Flex gap={2} direction="column">
          {constraintsArray.map((constraintNumber) => (
            <Flex key={`constraint_${constraintNumber}`} gap={4}>
              <Flex gap={2}>
                {varsArray.map((varNumber) => (
                  <Flex
                    gap={1}
                    key={`constraint_objective_${varNumber}`}
                    alignItems="center"
                  >
                    <TextInput
                      className="input"
                      placeholder={String(
                        (varNumber + 1) * (varNumber % 2 === 0 ? 1 : -1)
                      )}
                    />
                    <Text variant="body-3">
                      {MAP_VAR_NUMBER_TO_NAME[String(varNumber)]}
                    </Text>
                    {varNumber !== varsCount - 1 ? (
                      <Text variant="body-3" className="plus">
                        +
                      </Text>
                    ) : null}
                  </Flex>
                ))}
              </Flex>
              <Select
                options={SELECT_CONSTRAINT_SENSE_OPTIONS}
                defaultValue={DEFAULT_CONSTRAINT_SENSE_COUNT}
              />
              <TextInput className="input" placeholder={"0"} />
              <Button onClick={() => console.log(constraintNumber)}>
                Удалить
              </Button>
            </Flex>
          ))}
          <Button
            onClick={() => setConstraintsCount((prev) => prev + 1)}
            className={"addConstraintsButton"}
          >
            Добавить
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};
