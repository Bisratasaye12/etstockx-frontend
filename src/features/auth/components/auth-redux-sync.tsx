"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import type { UserRole } from "@/shared/api/dtos/iam";
import { useAppDispatch } from "@/shared/store/hooks";
import {
  setAuthError,
  setAuthStatus,
  setAuthUser,
  signOutState,
} from "@/features/auth/model/auth-slice";

/**
 * Keeps Redux auth slice aligned with NextAuth session (source of truth for tokens).
 */
export function AuthReduxSync() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (status === "loading") {
      dispatch(setAuthStatus("loading"));
      return;
    }

    if (status === "unauthenticated" || !session?.user?.id) {
      dispatch(signOutState());
      return;
    }

    const { user } = session;
    dispatch(
      setAuthUser({
        userId: user.id,
        email: user.email ?? "",
        role: user.role as UserRole,
        isActivated: user.isActivated,
      }),
    );
    dispatch(setAuthStatus("authenticated"));
    dispatch(setAuthError(null));
  }, [session, status, dispatch]);

  return null;
}
