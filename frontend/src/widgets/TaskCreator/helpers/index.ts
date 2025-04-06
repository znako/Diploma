import { useAppDispatch, useAppSelector } from "@/shared/hooks";
import { isNumeric } from "validator";
import { selectTaskCreatorData } from "../selectors";
import { taskCreatorActions, TaskCreatorState } from "../slice";
import { MilpDTO } from "../types";

export const createArrayByLength = (length: number) =>
  Array(length)
    .fill(0)
    .map((_, i) => i);

export const useValidateData = () => {
  const data = useAppSelector(selectTaskCreatorData);
  const dispatch = useAppDispatch();
  const { setObjectiveCoeffsError, setConstraintsCoeffsError } =
    taskCreatorActions;

  const validate = () => {
    if (!data.objectiveCoeffs.every((coeff) => coeff && isNumeric(coeff))) {
      dispatch(
        setObjectiveCoeffsError("Введите корректные коэффициенты функции")
      );
      return false;
    }
    if (
      !data.constraintsCoeffs.every((constraint) =>
        constraint.every((coeff) => coeff && isNumeric(coeff))
      ) ||
      !data.constraintsRhs.every((rhs) => rhs && isNumeric(rhs))
    ) {
      dispatch(
        setConstraintsCoeffsError(
          "Введите корректные коэффициенты функций ограничений"
        )
      );
      return false;
    }
    return true;
  };

  return { validate };
};

export const convertCreatingTaskDataToMilpDTO = (
  data: TaskCreatorState
): MilpDTO => {
  return {
    objective: {
      coefficients: data.objectiveCoeffs.map(Number),
      sense: data.objectiveSense,
    },
    variable_domains: createArrayByLength(data.varsCount).map(
      (i) => data.varsDomain[i]
    ),
    constraints: createArrayByLength(data.constraintsCount).map((i) => ({
      coefficients: data.constraintsCoeffs[i].map(Number),
      rhs: Number(data.constraintsRhs[i]),
      sense: data.constraintsSense[i],
    })),
    solver: data.solver,
  };
};
