import {
  Button,
  Flex,
  Select,
  Text,
  TextInput,
  useToaster,
} from "@gravity-ui/uikit";
import { useEffect, useMemo } from "react";

import { useSolveMilpMutation } from "@/api";
import { ErrorResponse } from "@/api/types";
import { Title } from "@/shared/components/Title";
import {
  BASE_TOASTER_ERROR_MESSAGE,
  SELECT_CONSTRAINT_SENSE_OPTIONS,
  SELECT_OBJECTIVE_SENSE_OPTIONS,
  SELECT_SOLVER_OPTIONS,
  SELECT_VAR_DOMAIN_OPTIONS,
} from "@/shared/consts";
import { useAppDispatch, useAppSelector } from "@/shared/hooks";
import {
  ConstraintSenseEnum,
  ObjectiveSenseEnum,
  SolverEnum,
  VariablesDomainEnum,
} from "@/shared/types";
import { ExcelUploader } from "../ExcelUploader";
import { MAP_VAR_NUMBER_TO_NAME, SELECT_VARS_COUNT_OPTIONS } from "./consts";
import {
  convertCreatingTaskDataToMilpDTO,
  createArrayByLength,
  useValidateData,
} from "./helpers";
import {
  selectConstraintsCoeffs,
  selectConstraintsCoeffsError,
  selectConstraintsCount,
  selectConstraintsRhs,
  selectConstraintsSense,
  selectDisableUploadButton,
  selectObjectiveCoeffs,
  selectObjectiveCoeffsError,
  selectObjectiveSense,
  selectSolver,
  selectTaskCreatorData,
  selectVarsCount,
  selectVarsDomain,
} from "./selectors";
import { taskCreatorActions } from "./slice";
import styles from "./styles.module.css";

export const TaskCreator = () => {
  const dispatch = useAppDispatch();
  const { add } = useToaster();
  const creatingTaskData = useAppSelector(selectTaskCreatorData);
  const varsCount = useAppSelector(selectVarsCount);
  const constraintsCount = useAppSelector(selectConstraintsCount);
  const varsDomain = useAppSelector(selectVarsDomain);
  const objectiveCoeffs = useAppSelector(selectObjectiveCoeffs);
  const objectiveSense = useAppSelector(selectObjectiveSense);
  const constraintsCoeffs = useAppSelector(selectConstraintsCoeffs);
  const constraintsSense = useAppSelector(selectConstraintsSense);
  const constraintsRhs = useAppSelector(selectConstraintsRhs);
  const solver = useAppSelector(selectSolver);
  const disableUploadButton = useAppSelector(selectDisableUploadButton);
  const objectiveCoeffsError = useAppSelector(selectObjectiveCoeffsError);
  const constraintsCoeffsError = useAppSelector(selectConstraintsCoeffsError);
  const {
    setVarsCount,
    addConstraint,
    removeConstraintById,
    setVarsDomain,
    setObjectiveCoeffs,
    setObjectiveSense,
    setConstraintsCoeffs,
    setConstraintsSense,
    setConstraintsRhs,
    setSolver,
  } = taskCreatorActions;
  const [solveMilp, { error }] = useSolveMilpMutation();
  const { validate } = useValidateData();

  useEffect(() => {
    if (error) {
      add({
        name: "SolveMilpError",
        title:
          (error as ErrorResponse)?.data?.error ?? BASE_TOASTER_ERROR_MESSAGE,
        theme: "danger",
      });
    }
  }, [error, add]);

  const varsArray = useMemo(() => createArrayByLength(varsCount), [varsCount]);
  const constraintsArray = useMemo(
    () => createArrayByLength(constraintsCount),
    [constraintsCount]
  );

  const onSolveMilp = () => {
    const isSuccess = validate();
    if (isSuccess) {
      const milpDto = convertCreatingTaskDataToMilpDTO(creatingTaskData);
      solveMilp(milpDto);
    }
  };

  return (
    <Flex className={styles.CreatingTask} direction={"column"} gap={8}>
      <Title title="Конфигурация задачи" />
      <Flex direction={"column"} gap={5}>
        <Flex gap={2}>
          <Text variant="subheader-3">Количество переменных</Text>
          <Select
            options={SELECT_VARS_COUNT_OPTIONS}
            onUpdate={(value) => dispatch(setVarsCount(Number(value[0])))}
            value={[String(varsCount)]}
          />
        </Flex>
        <Flex gap={2} direction={"column"}>
          <Text variant="subheader-3">Указание на целочисленность</Text>
          <Flex direction={"row"} gap={2} wrap>
            {varsArray.map((varIndex) => (
              <Select
                key={`domain_${varIndex}`}
                options={SELECT_VAR_DOMAIN_OPTIONS}
                label={`${MAP_VAR_NUMBER_TO_NAME[varIndex]} - `}
                onUpdate={(value) =>
                  dispatch(
                    setVarsDomain({
                      index: varIndex,
                      domain: value[0] as VariablesDomainEnum,
                    })
                  )
                }
                value={[varsDomain[varIndex]]}
                className={styles.selectVarDomain}
              />
            ))}
          </Flex>
        </Flex>
        <Flex gap={2} direction="column">
          <Text variant="subheader-3">Линейная функция</Text>
          {objectiveCoeffsError && (
            <Text variant="body-1" color="danger">
              {objectiveCoeffsError}
            </Text>
          )}
          <Flex gap={3} className={styles.functionInput}>
            <Flex gap={2}>
              {varsArray.map((varIndex) => (
                <Flex gap={1} key={`objective_${varIndex}`} alignItems="center">
                  <TextInput
                    className={styles.input}
                    placeholder={String(
                      (varIndex + 1) * (varIndex % 2 === 0 ? 1 : -1)
                    )}
                    onUpdate={(value) =>
                      dispatch(
                        setObjectiveCoeffs({
                          index: varIndex,
                          coeff: value,
                        })
                      )
                    }
                    value={objectiveCoeffs[varIndex] ?? ""}
                  />
                  <Text variant="body-3">
                    {MAP_VAR_NUMBER_TO_NAME[varIndex]}
                  </Text>
                  {varIndex !== varsCount - 1 ? (
                    <Text variant="body-3" className={styles.plus}>
                      +
                    </Text>
                  ) : null}
                </Flex>
              ))}
            </Flex>
            <Flex>
              <Select
                options={SELECT_OBJECTIVE_SENSE_OPTIONS}
                onUpdate={(value) =>
                  dispatch(setObjectiveSense(value[0] as ObjectiveSenseEnum))
                }
                value={[objectiveSense]}
                className={styles.selectObjSense}
              />
            </Flex>
          </Flex>
        </Flex>
        <Flex gap={2} direction="column">
          <Text variant="subheader-3">Линейные ограничения</Text>
          {constraintsCoeffsError && (
            <Text variant="body-1" color="danger">
              {constraintsCoeffsError}
            </Text>
          )}
          <Flex gap={2} direction="column" className={styles.functionInput}>
            {constraintsArray.map((constraintIndex) => (
              <Flex key={`constraint_${constraintIndex}`} gap={4}>
                <Flex gap={2}>
                  {varsArray.map((varIndex) => (
                    <Flex
                      gap={1}
                      key={`constraint_objective_${varIndex}`}
                      alignItems="center"
                    >
                      <TextInput
                        className={styles.input}
                        placeholder={String(
                          (varIndex + 1) * (varIndex % 2 === 0 ? 1 : -1)
                        )}
                        onUpdate={(value) =>
                          dispatch(
                            setConstraintsCoeffs({
                              constraintIndex,
                              varIndex,
                              coeff: value,
                            })
                          )
                        }
                        value={
                          constraintsCoeffs[constraintIndex][varIndex] ?? ""
                        }
                      />
                      <Text variant="body-3">
                        {MAP_VAR_NUMBER_TO_NAME[varIndex]}
                      </Text>
                      {varIndex !== varsCount - 1 ? (
                        <Text variant="body-3" className={styles.plus}>
                          +
                        </Text>
                      ) : null}
                    </Flex>
                  ))}
                </Flex>
                <Select
                  options={SELECT_CONSTRAINT_SENSE_OPTIONS}
                  onUpdate={(value) =>
                    dispatch(
                      setConstraintsSense({
                        index: constraintIndex,
                        sense: value[0] as ConstraintSenseEnum,
                      })
                    )
                  }
                  value={[constraintsSense[constraintIndex]]}
                />
                <TextInput
                  className={styles.input}
                  placeholder="0"
                  onUpdate={(value) =>
                    dispatch(
                      setConstraintsRhs({ index: constraintIndex, rhs: value })
                    )
                  }
                  value={constraintsRhs[constraintIndex] ?? ""}
                />
                <Button
                  onClick={() =>
                    dispatch(removeConstraintById(constraintIndex))
                  }
                >
                  Удалить
                </Button>
              </Flex>
            ))}
            <Button
              onClick={() => dispatch(addConstraint())}
              className={styles.addConstraintsButton}
            >
              Добавить
            </Button>
          </Flex>
        </Flex>
        <Flex gap={2}>
          <Text variant="subheader-3">Решатель</Text>
          <Select
            options={SELECT_SOLVER_OPTIONS}
            onUpdate={(value) => dispatch(setSolver(value[0] as SolverEnum))}
            value={[solver]}
          />
        </Flex>
        <Flex gap={2} alignItems={"center"}>
          <Button
            view="action"
            onClick={onSolveMilp}
            className={styles.sendButton}
            size="l"
            disabled={
              !!constraintsCoeffsError ||
              !!objectiveCoeffsError ||
              !!disableUploadButton
            }
          >
            Решить
          </Button>
          <ExcelUploader />
        </Flex>
      </Flex>
    </Flex>
  );
};
