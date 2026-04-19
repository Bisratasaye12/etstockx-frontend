import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserRole } from "@/shared/api/dtos/iam";

export interface AuthUserState {
  userId: string;
  email: string;
  role: UserRole;
  isActivated: boolean;
}

export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated";

export interface AuthState {
  /** Denormalized from NextAuth session for Redux subscribers. */
  user: AuthUserState | null;
  status: AuthStatus;
  lastError: string | null;
  registration: {
    phase: "idle" | "submitting" | "success" | "error";
    message: string | null;
    registeredUserId: string | null;
  };
}

const initialState: AuthState = {
  user: null,
  status: "idle",
  lastError: null,
  registration: {
    phase: "idle",
    message: null,
    registeredUserId: null,
  },
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthUser(state, action: PayloadAction<AuthUserState | null>) {
      state.user = action.payload;
    },
    setAuthStatus(state, action: PayloadAction<AuthStatus>) {
      state.status = action.payload;
    },
    setAuthError(state, action: PayloadAction<string | null>) {
      state.lastError = action.payload;
    },
    registrationSubmitting(state) {
      state.registration.phase = "submitting";
      state.registration.message = null;
      state.registration.registeredUserId = null;
    },
    registrationSucceeded(
      state,
      action: PayloadAction<{ userId: string; message: string }>,
    ) {
      state.registration.phase = "success";
      state.registration.registeredUserId = action.payload.userId;
      state.registration.message = action.payload.message;
    },
    registrationFailed(state, action: PayloadAction<string>) {
      state.registration.phase = "error";
      state.registration.message = action.payload;
      state.registration.registeredUserId = null;
    },
    resetRegistration(state) {
      state.registration = {
        phase: "idle",
        message: null,
        registeredUserId: null,
      };
    },
    signOutState(state) {
      state.user = null;
      state.status = "unauthenticated";
      state.lastError = null;
    },
  },
});

export const {
  setAuthUser,
  setAuthStatus,
  setAuthError,
  registrationSubmitting,
  registrationSucceeded,
  registrationFailed,
  resetRegistration,
  signOutState,
} = authSlice.actions;

export const authReducer = authSlice.reducer;
