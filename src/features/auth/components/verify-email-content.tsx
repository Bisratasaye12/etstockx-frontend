"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { browserApi } from "@/shared/api/browser-api";
import { getApiErrorMessage } from "@/shared/lib/api-error";

export function VerifyEmailContent() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    if (!token || !email) {
      setStatus("err");
      setMessage("Missing token or email.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await browserApi.get("/v1/auth/confirm-email", {
          params: { token, email },
        });
        if (!cancelled) {
          setStatus("ok");
          setMessage(t("verifySuccess"));
        }
      } catch (e) {
        if (!cancelled) {
          setStatus("err");
          setMessage(getApiErrorMessage(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, t]);

  if (status === "idle") {
    return <p className="text-muted-foreground text-sm">…</p>;
  }

  return (
    <p
      className={
        status === "ok"
          ? "text-sm text-green-700 dark:text-green-400"
          : "text-destructive text-sm"
      }
      role="status"
    >
      {status === "ok" ? message : (message ?? t("verifyFailed"))}
    </p>
  );
}
