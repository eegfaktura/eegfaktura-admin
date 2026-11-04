import {combineReducers, configureStore} from "@reduxjs/toolkit";
import appStateSlice from "./features/appStateSlice";
import eegStateSlice from "./features/eegStateSlice";


const globalState = combineReducers(
  {
    appStateSlice,
    eegStateSlice
  })

export const makeStore = () => configureStore({
  reducer: globalState
});

export const store = makeStore();

export type RootState = ReturnType<typeof store.getState>;