"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function useAppLogout() {
  const [pending, setPending] = useState(false);

  async function logout(callbackUrl: string) {
    if (pending) return;
    setPending(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("[auth] backend logout failed", error);
    }

    const result = await signOut({
      callbackUrl,
      redirect: false,
    });

    window.location.assign(result?.url ?? callbackUrl);
  }

  return { logout, pending };
}
