import { Button, Flex, Select, Text, TextInput } from "@gravity-ui/uikit";
import { useMemo } from "react";

import { useAppDispatch, useAppSelector } from "@/shared/hooks/hooks";
import {
  MAP_VAR_NUMBER_TO_NAME,
  SELECT_CONSTRAINT_SENSE_OPTIONS,
  SELECT_OBJECTIVE_SENSE_OPTIONS,
  SELECT_VAR_DOMAIN_OPTIONS,
  SELECT_VARS_COUNT_OPTIONS,
} from "./consts/consts";
import { createArrayByLength } from "./helpers/helpers";
import {
  selectConstraintsCoeffs,
  selectConstraintsCount,
  selectConstraintsRhs,
  selectConstraintsSense,
  selectObjectiveCoeffs,
  selectObjectiveSense,
  selectVarsCount,
  selectVarsDomain,
} from "./selectors/selectors";
import { creatingTaskActions } from "./slice/taskCreatingSlice";
import "./styles.css";
import {
  ConstraintSenseEnum,
  ObjectiveSenseEnum,
  VariablesDomainEnum,
} from "./types/types";

export const CreatingTask = () => {
  const dispatch = useAppDispatch();
  const varsCount = useAppSelector(selectVarsCount);
  const constraintsCount = useAppSelector(selectConstraintsCount);
  const varsDomain = useAppSelector(selectVarsDomain);
  const objectiveCoeffs = useAppSelector(selectObjectiveCoeffs);
  const objectiveSense = useAppSelector(selectObjectiveSense);
  const constraintsCoeffs = useAppSelector(selectConstraintsCoeffs);
  const constraintsSense = useAppSelector(selectConstraintsSense);
  const constraintsRhs = useAppSelector(selectConstraintsRhs);
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
  } = creatingTaskActions;

  const varsArray = useMemo(() => createArrayByLength(varsCount), [varsCount]);
  const constraintsArray = useMemo(
    () => createArrayByLength(constraintsCount),
    [constraintsCount]
  );

  return (
    <Flex direction={"column"} gap={5}>
      <Flex gap={2}>
        <Text variant="header-1">Количество переменных</Text>
        <Select
          options={SELECT_VARS_COUNT_OPTIONS}
          onUpdate={(value) => dispatch(setVarsCount(Number(value[0])))}
          value={[String(varsCount)]}
        />
      </Flex>
      <Flex gap={2} direction={"column"}>
        <Text variant="header-1">Указание на целочисленность</Text>
        <Flex direction={"row"} gap={2}>
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
            />
          ))}
        </Flex>
      </Flex>
      <Flex gap={2} direction="column">
        <Text variant="header-1">Линейная функция</Text>
        <Flex gap={3}>
          <Flex gap={2}>
            {varsArray.map((varIndex) => (
              <Flex gap={1} key={`objective_${varIndex}`} alignItems="center">
                <TextInput
                  className="input"
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
                <Text variant="body-3">{MAP_VAR_NUMBER_TO_NAME[varIndex]}</Text>
                {varIndex !== varsCount - 1 ? (
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
              onUpdate={(value) =>
                dispatch(setObjectiveSense(value[0] as ObjectiveSenseEnum))
              }
              value={[objectiveSense]}
            />
          </Flex>
        </Flex>
      </Flex>
      <Flex gap={2} direction="column">
        <Text variant="header-1">Линейные ограничения</Text>
        <Flex gap={2} direction="column">
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
                      className="input"
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
                      value={constraintsCoeffs[constraintIndex][varIndex] ?? ""}
                    />
                    <Text variant="body-3">
                      {MAP_VAR_NUMBER_TO_NAME[varIndex]}
                    </Text>
                    {varIndex !== varsCount - 1 ? (
                      <Text variant="body-3" className="plus">
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
                className="input"
                placeholder="0"
                onUpdate={(value) =>
                  dispatch(
                    setConstraintsRhs({ index: constraintIndex, rhs: value })
                  )
                }
                value={constraintsRhs[constraintIndex] ?? undefined}
              />
              <Button
                onClick={() => dispatch(removeConstraintById(constraintIndex))}
              >
                Удалить
              </Button>
            </Flex>
          ))}
          <Button
            onClick={() => dispatch(addConstraint())}
            className={"addConstraintsButton"}
          >
            Добавить
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};
