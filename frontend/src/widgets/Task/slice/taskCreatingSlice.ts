import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { DEFAULT_VARS_COUNT } from "../consts/consts";
import {
  ConstraintSenseEnum,
  ObjectiveSenseEnum,
  VariablesDomainEnum,
} from "../types/types";

export interface CreatingTaskState {
  varsCount: number;
  constraintsCount: number;
  varsDomain: VariablesDomainEnum[];
  objectiveCoeffs: Array<null | string>;
  objectiveSense: ObjectiveSenseEnum;
  constraintsCoeffs: Array<null | string>[];
  constraintsSense: ConstraintSenseEnum[];
  constraintsRhs: Array<null | string>;

  // Ошибки
  objectiveCoeffsError: string | null;
  constraintsCoeffsError: string | null;
}

const initialState: CreatingTaskState = {
  varsCount: DEFAULT_VARS_COUNT,
  constraintsCount: DEFAULT_VARS_COUNT,
  varsDomain: [
    VariablesDomainEnum.NON_NEGATIVE_INTEGERS,
    VariablesDomainEnum.NON_NEGATIVE_INTEGERS,
  ],
  objectiveCoeffs: [null, null],
  objectiveSense: ObjectiveSenseEnum.MAXIMIZE,
  constraintsCoeffs: [
    [null, null],
    [null, null],
  ],
  constraintsSense: [
    ConstraintSenseEnum.LESS_OR_EQUAL,
    ConstraintSenseEnum.LESS_OR_EQUAL,
  ],
  constraintsRhs: [null, null],

  // Ошибки
  objectiveCoeffsError: null,
  constraintsCoeffsError: null,
};

export const creatingTaskSlice = createSlice({
  name: "creatingTask",
  initialState,
  reducers: {
    setVarsCount: (state, action: PayloadAction<number>) => {
      const diff = action.payload - state.varsCount;
      for (let i = 1; i <= Math.abs(diff); i++) {
        if (diff < 0) {
          state.varsDomain.pop();
          state.objectiveCoeffs.pop();
          state.constraintsCoeffs.map((constraint) => {
            constraint.pop();
            return constraint;
          });
        } else {
          state.varsDomain.push(VariablesDomainEnum.NON_NEGATIVE_INTEGERS);
          state.objectiveCoeffs.push(null);
          state.constraintsCoeffs = state.constraintsCoeffs.map(
            (constraint) => [...constraint, null]
          );
        }
      }

      state.varsCount = action.payload;
      state.constraintsCoeffsError = null;
      state.objectiveCoeffsError = null;
    },
    addConstraint: (state) => {
      state.constraintsCoeffs.push(Array(state.varsCount).fill(null));
      state.constraintsSense.push(ConstraintSenseEnum.LESS_OR_EQUAL);
      state.constraintsRhs.push(null);
      state.constraintsCount = state.constraintsCount + 1;
    },
    removeConstraintById: (state, action: PayloadAction<number>) => {
      state.constraintsCoeffs.splice(action.payload, 1);
      state.constraintsSense.splice(action.payload, 1);
      state.constraintsRhs.splice(action.payload, 1);
      state.constraintsCount = state.constraintsCount - 1;
      state.constraintsCoeffsError = null;
    },
    setVarsDomain: (
      state,
      action: PayloadAction<{ index: number; domain: VariablesDomainEnum }>
    ) => {
      state.varsDomain[action.payload.index] = action.payload.domain;
    },
    setObjectiveCoeffs: (
      state,
      action: PayloadAction<{ index: number; coeff: string }>
    ) => {
      const {
        payload: { coeff, index },
      } = action;
      state.objectiveCoeffs[index] = coeff;
      state.objectiveCoeffsError = null;
    },
    setObjectiveSense: (state, action: PayloadAction<ObjectiveSenseEnum>) => {
      state.objectiveSense = action.payload;
    },
    setConstraintsCoeffs: (
      state,
      action: PayloadAction<{
        constraintIndex: number;
        varIndex: number;
        coeff: string;
      }>
    ) => {
      const {
        payload: { coeff, constraintIndex, varIndex },
      } = action;
      state.constraintsCoeffs[constraintIndex][varIndex] = coeff;
      state.constraintsCoeffsError = null;
    },
    setConstraintsSense: (
      state,
      action: PayloadAction<{ index: number; sense: ConstraintSenseEnum }>
    ) => {
      const {
        payload: { sense, index },
      } = action;
      state.constraintsSense[index] = sense;
    },
    setConstraintsRhs: (
      state,
      action: PayloadAction<{ index: number; rhs: string }>
    ) => {
      const {
        payload: { rhs, index },
      } = action;
      state.constraintsRhs[index] = rhs;
      state.constraintsCoeffsError = null;
    },

    // Ошибки
    setObjectiveCoeffsError: (state, action: PayloadAction<string>) => {
      state.objectiveCoeffsError = action.payload;
    },
    setConstraintsCoeffsError: (state, action: PayloadAction<string>) => {
      state.constraintsCoeffsError = action.payload;
    },
  },
});

export const { actions: creatingTaskActions, reducer: creatingTaskReducer } =
  creatingTaskSlice;
