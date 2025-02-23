import { useAppDispatch, useAppSelector } from "@/shared/hooks/hooks";
import { isNumeric } from "validator";
import { selectCreatingTaskData } from "../selectors/selectors";
import { creatingTaskActions } from "../slice/taskCreatingSlice";

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
    }
  };

  return { validate };
};
