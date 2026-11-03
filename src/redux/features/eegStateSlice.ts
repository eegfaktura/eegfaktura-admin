import {createEntityAdapter, createSelector, createSlice, EntityState, PayloadAction} from "@reduxjs/toolkit";
import {EegMember, GridOperator} from "../../model/eeg.model";
import {RootState} from "../store";

interface eegState {
  eegSlice: EntityState<EegMember>;
  selectedEeg: EegMember | null;
  gridOperators: EntityState<GridOperator>;
}

export const eegAdapter = createEntityAdapter<EegMember>({
  selectId: (eeg) => eeg.tenant
});

export const operatorsAdapter = createEntityAdapter<GridOperator>()

const initialState: eegState = {
  eegSlice: eegAdapter.getInitialState(),
  selectedEeg: null,
  gridOperators: operatorsAdapter.getInitialState(),
};

export const eegStateSlice = createSlice({
  name: "eegState",
  initialState,
  reducers: {
    setEegAll: (state, action: PayloadAction<EegMember[]>) => {
      eegAdapter.setAll(state.eegSlice, action.payload);
    },

    setSelectedEeg: (state, action: PayloadAction<EegMember>) => {
      state.selectedEeg = action.payload
    },

    updateEegByTenant: (state, action: PayloadAction<EegMember>) => {
      eegAdapter.updateOne(state.eegSlice, {id: action.payload.tenant,  changes: action.payload});
      // state.selectedEeg = action.payload;
    },

    setOperators: (state, action: PayloadAction<GridOperator[]>) => {
      operatorsAdapter.setAll(state.gridOperators, action.payload)
    }
  }
});

export const {
  setEegAll,
  setSelectedEeg,
  updateEegByTenant,
  setOperators,
} = eegStateSlice.actions;

export default eegStateSlice.reducer;

const {selectAll} = eegAdapter.getSelectors();

const eegSelector = (store: RootState) => (store.eegStateSlice)

export const selectedEeg = createSelector(
  eegSelector,
  eegSlice => eegSlice.selectedEeg
)

export const allEegs = createSelector(
  eegSelector,
  eegSlice => selectAll(eegSlice.eegSlice)
)

export const selectGridOperators = createSelector(
  eegSelector,
  gridOperators => operatorsAdapter.getSelectors().selectAll(gridOperators.gridOperators)
)