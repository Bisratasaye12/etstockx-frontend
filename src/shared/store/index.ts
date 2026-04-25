import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "@/features/auth/model/auth-slice";
import { uiReducer } from "./ui-slice";

export function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
