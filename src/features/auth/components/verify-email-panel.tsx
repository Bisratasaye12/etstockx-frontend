"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, Info, Mail } from "lucide-react";
import { browserApi } from "@/shared/api/browser-api";
import type { ResendVerificationRequestDto } from "@/shared/api/dtos/iam";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Link } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";

const RESEND_COOLDOWN_SEC = 60;

function formatCooldown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type LinkFlowStatus = "loading" | "ok" | "err";

export function VerifyEmailPanel() {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  const [linkStatus, setLinkStatus] = useState<LinkFlowStatus | null>(null);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const email = emailParam?.trim() ?? "";
  const isLinkMode = Boolean(token && email);

  const showTransientToast = useCallback((message: string, ms = 5000) => {
    setToastMessage(message);
    setToastOpen(true);
    window.setTimeout(() => setToastOpen(false), ms);
  }, []);

  useEffect(() => {
    if (!isLinkMode || !token || !email) return;
    let cancelled = false;
    (async () => {
      try {
        await browserApi.get("/v1/auth/confirm-email", {
          params: { token, email },
        });
        if (!cancelled) {
          setLinkStatus("ok");
          setLinkMessage(t("verifySuccess"));
        }
      } catch (e) {
        if (!cancelled) {
          setLinkStatus("err");
          setLinkMessage(getApiErrorMessage(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLinkMode, token, email, t]);

  /** Initial “verification email sent” acknowledgement (landing from registration). */
  useEffect(() => {
    if (!email || isLinkMode) return;
    const fromRegistration = searchParams.get("registered") === "1";
    if (!fromRegistration) return;
    showTransientToast(t("verifyEmailSentToast"));
    setCooldown(RESEND_COOLDOWN_SEC);
  }, [email, isLinkMode, searchParams, showTransientToast, t]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const resend = useCallback(async () => {
    if (!email || cooldown > 0 || resending) return;
    setResending(true);
    setResendError(null);
    try {
      const body: ResendVerificationRequestDto = { email };
      await browserApi.post("/v1/auth/resend-verification", body);
      showTransientToast(t("verifyEmailSentToast"));
      setCooldown(RESEND_COOLDOWN_SEC);
    } catch (e) {
      setResendError(getApiErrorMessage(e));
    } finally {
      setResending(false);
    }
  }, [email, cooldown, resending, showTransientToast, t]);

  const cardShell =
    "border-border bg-card text-card-foreground w-full max-w-md rounded-xl border shadow-lg shadow-black/5";

  if (!email && !isLinkMode) {
    return (
      <div className="flex flex-1 flex-col px-6 py-10 md:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md flex-1">
          <div className={cn(cardShell, "p-8 md:p-9")}>
            <p className="text-muted-foreground text-sm">
              {t("verifyMissingEmail")}
            </p>
            <Link
              href="/register"
              className="text-primary mt-6 inline-block text-sm font-semibold underline-offset-4 hover:underline"
            >
              {tNav("register")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLinkMode) {
    return (
      <div className="relative flex flex-1 flex-col px-6 py-10 md:px-12 lg:px-16">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-10">
          <div className={cn(cardShell, "p-8 md:p-9")}>
            {linkStatus !== "ok" && linkStatus !== "err" ? (
              <p className="text-muted-foreground text-sm">
                {t("verifyLinkLoading")}
              </p>
            ) : linkStatus === "ok" ? (
              <div className="flex flex-col gap-8 text-center">
                <div className="bg-primary/10 text-primary mx-auto flex size-16 items-center justify-center rounded-full">
                  <Mail className="size-8" aria-hidden />
                </div>
                <div className="space-y-3">
                  <p className="font-heading text-foreground text-lg font-semibold">
                    {linkMessage ?? t("verifySuccess")}
                  </p>
                  <Link
                    href="/login"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "inline-flex h-11 w-full shrink-0",
                    )}
                  >
                    {t("verifyGoToLogin")}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="text-destructive flex items-start gap-2 text-sm">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{linkMessage ?? t("verifyFailed")}</span>
                </div>
                {email ? (
                  <button
                    type="button"
                    disabled={cooldown > 0 || resending}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "w-full shrink-0",
                    )}
                    onClick={() => void resend()}
                  >
                    {t("resendVerificationLink")}
                  </button>
                ) : null}
                {cooldown > 0 && email ? (
                  <p className="text-muted-foreground text-center text-xs">
                    {t("verifyResendIn", { time: formatCooldown(cooldown) })}
                  </p>
                ) : null}
                {resendError ? (
                  <p
                    className="text-destructive text-center text-xs"
                    role="alert"
                  >
                    {resendError}
                  </p>
                ) : null}
                <Link
                  href="/register"
                  className="text-primary text-center text-sm font-semibold underline-offset-4 hover:underline"
                >
                  {t("verifyTryRegisterAgain")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /** Email-interstitial — link-based verification (`?email=`). */
  return (
    <div className="relative flex min-h-[min(100dvh,100%)] flex-1 flex-col px-6 py-10 md:px-12 lg:px-16">
      {toastOpen ? (
        <div
          className="bg-card border-border fixed top-4 right-4 z-50 flex max-w-[min(calc(100vw-2rem),20rem)] items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg sm:top-5 md:right-10"
          role="status"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-600/15 text-green-700 dark:bg-green-500/20 dark:text-green-400">
            <Check className="size-4" aria-hidden />
          </span>
          <span className="text-foreground font-medium leading-snug">
            {toastMessage}
          </span>
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div
          className={cn(
            cardShell,
            "flex flex-col gap-8 p-8 text-center md:p-9 md:text-left",
          )}
        >
          <div className="flex flex-col items-center gap-8 md:items-start md:text-left">
            <div className="bg-primary/10 text-primary flex size-[4.25rem] items-center justify-center rounded-full">
              <Mail className="size-9" aria-hidden />
            </div>

            <div className="w-full space-y-2 md:text-left">
              <h2 className="font-heading text-foreground text-2xl font-bold tracking-tight">
                {t("verifyInterstitialTitle")}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed md:text-[0.9375rem]">
                {t("verifyLinkSentLead")}
              </p>
            </div>
          </div>

          <div
            className="border-primary/25 bg-primary/8 text-primary flex gap-3 rounded-lg border px-3 py-2.5 text-sm leading-snug"
            role="note"
          >
            <Info className="mt-0.5 size-4 shrink-0 opacity-90" aria-hidden />
            {t("verifyLinkExpiryBanner")}
          </div>

          <div className="flex flex-col gap-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={cooldown > 0 || resending || !email}
              className="h-11 w-full shrink-0"
              onClick={() => void resend()}
            >
              {resending ? "…" : t("resendVerificationLink")}
            </Button>
            {cooldown > 0 ? (
              <p className="text-muted-foreground text-center text-xs">
                {t("verifyResendIn", { time: formatCooldown(cooldown) })}
              </p>
            ) : null}
            {resendError ? (
              <p className="text-destructive text-center text-xs" role="alert">
                {resendError}
              </p>
            ) : null}
          </div>

          <p className="text-muted-foreground text-center text-xs leading-relaxed md:text-left">
            {t("verifySpamFolderHint")}
          </p>

          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "inline-flex h-11 w-full shrink-0",
            )}
          >
            {t("verifyGoToLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}
