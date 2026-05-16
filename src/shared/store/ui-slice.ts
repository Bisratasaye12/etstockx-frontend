import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  /** When true, portal sidebar shows icons only. */
  sidebarCollapsed: boolean;
}

const initialState: UiState = {
  sidebarCollapsed: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    toggleSidebarCollapsed(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
});

export const { setSidebarCollapsed, toggleSidebarCollapsed } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
