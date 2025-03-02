import { useAppDispatch, useAppSelector } from "@/shared/hooks/hooks";
import { isNumeric } from "validator";
import { MAP_VAR_NUMBER_TO_NAME } from "../consts/consts";
import { selectCreatingTaskData } from "../selectors/selectors";
import {
  creatingTaskActions,
  CreatingTaskState,
} from "../slice/taskCreatingSlice";
import { MilpDTO } from "../types/types";

export const createArrayByLength = (length: number) =>
  Array(length)
    .fill(0)
    .map((_, i) => i);

export const useValidateData = () => {
  const data = useAppSelector(selectCreatingTaskData);
  const dispatch = useAppDispatch();
  const { setObjectiveCoeffsError, setConstraintsCoeffsError } =
    creatingTaskActions;

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
  data: CreatingTaskState
): MilpDTO => {
  return {
    objective: {
      coefficients: data.objectiveCoeffs.map(Number),
      sense: data.objectiveSense,
    },
    variables: createArrayByLength(data.varsCount).map((i) => ({
      name: MAP_VAR_NUMBER_TO_NAME[i],
      domain: data.varsDomain[i],
    })),
    constraints: createArrayByLength(data.constraintsCount).map((i) => ({
      coefficients: data.constraintsCoeffs[i].map(Number),
      rhs: Number(data.constraintsRhs[i]),
      sense: data.constraintsSense[i],
    })),
  };
};
