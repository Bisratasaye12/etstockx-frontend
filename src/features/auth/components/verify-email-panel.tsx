"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { browserApi } from "@/shared/api/browser-api";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Link } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

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

  const [digits, setDigits] = useState<string[]>(() =>
    Array(OTP_LENGTH).fill(""),
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [otpError, setOtpError] = useState(false);
  const [otpExpired, setOtpExpired] = useState(false);
  const [resendBanner, setResendBanner] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const email = emailParam?.trim() ?? "";
  const isLinkMode = Boolean(token && email);

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

  useEffect(() => {
    if (isLinkMode) return;
    const id = window.setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [isLinkMode]);

  const focusIndex = useCallback((i: number) => {
    inputRefs.current[i]?.focus();
    inputRefs.current[i]?.select();
  }, []);

  const setDigit = useCallback(
    (index: number, value: string) => {
      const d = value.replace(/\D/g, "").slice(-1);
      setDigits((prev) => {
        const next = [...prev];
        next[index] = d;
        return next;
      });
      if (d && index < OTP_LENGTH - 1) {
        focusIndex(index + 1);
      }
    },
    [focusIndex],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
      if (!pasted) return;
      const chars = pasted.slice(0, OTP_LENGTH).split("");
      setDigits(() => {
        const next = Array(OTP_LENGTH).fill("");
        chars.forEach((ch, i) => {
          next[i] = ch;
        });
        return next;
      });
      const last = Math.min(chars.length, OTP_LENGTH) - 1;
      if (last >= 0) focusIndex(last);
    },
    [focusIndex],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        focusIndex(index - 1);
      }
    },
    [digits, focusIndex],
  );

  const code = digits.join("");

  const submitOtp = useCallback(async () => {
    if (code.length !== OTP_LENGTH || !email) return;
    setSubmitting(true);
    setOtpError(false);
    setOtpExpired(false);
    setResendBanner(false);
    try {
      /** Backend: confirm 6-digit code; path/body may match your API. */
      await browserApi.post("/v1/auth/confirm-email", {
        email,
        code,
      });
      setLinkStatus("ok");
      setLinkMessage(t("verifySuccess"));
    } catch (e) {
      const msg = getApiErrorMessage(e).toLowerCase();
      if (msg.includes("expired") || msg.includes("expire")) {
        setOtpExpired(true);
        setCooldown(0);
      } else {
        setOtpError(true);
      }
    } finally {
      setSubmitting(false);
    }
  }, [code, email, t]);

  const resend = useCallback(async () => {
    if (!email || cooldown > 0 || resending) return;
    setResending(true);
    setOtpError(false);
    setOtpExpired(false);
    try {
      await browserApi.post("/v1/auth/resend-verification", { email });
      setResendBanner(true);
      setCooldown(RESEND_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(""));
      focusIndex(0);
    } catch {
      setOtpError(true);
    } finally {
      setResending(false);
    }
  }, [email, cooldown, resending, focusIndex]);

  if (!email && !isLinkMode) {
    return (
      <div className="mx-auto w-full max-w-xl px-6 py-10 md:px-12 lg:px-16">
        <div className="border-border bg-card rounded-2xl border p-6 shadow-sm md:p-8">
          <p className="text-muted-foreground text-sm">
            {t("verifyMissingEmail")}
          </p>
          <Link
            href="/register"
            className="text-primary mt-4 inline-block text-sm font-medium underline-offset-4 hover:underline"
          >
            {tNav("register")}
          </Link>
        </div>
      </div>
    );
  }

  if (isLinkMode) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 py-10 md:px-12 lg:px-16">
        <div className="border-border bg-card rounded-2xl border p-6 shadow-sm md:p-8">
          {linkStatus !== "ok" && linkStatus !== "err" ? (
            <p className="text-muted-foreground text-sm">
              {t("verifyLinkLoading")}
            </p>
          ) : linkStatus === "ok" ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="size-5 shrink-0" aria-hidden />
                <p className="text-sm font-medium">{linkMessage}</p>
              </div>
              <Link
                href="/login"
                className={cn(buttonVariants({ size: "lg" }), "h-11 w-full")}
              >
                {t("verifyGoToLogin")}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="text-destructive flex items-start gap-2 text-sm">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{linkMessage ?? t("verifyFailed")}</span>
              </div>
              <Link
                href="/register"
                className="text-primary text-sm font-medium underline-offset-4 hover:underline"
              >
                {t("verifyTryRegisterAgain")}
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  const showVerifiedCard = linkStatus === "ok" && !isLinkMode;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 py-10 md:px-12 lg:px-16">
      <div className="border-border bg-card rounded-2xl border p-6 shadow-sm md:p-8">
        {showVerifiedCard ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="size-5 shrink-0" aria-hidden />
              <p className="text-sm font-medium">
                {linkMessage ?? t("verifySuccess")}
              </p>
            </div>
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "lg" }), "h-11 w-full")}
            >
              {t("verifyGoToLogin")}
            </Link>
          </div>
        ) : (
          <>
            <h2 className="font-heading text-foreground text-2xl font-bold tracking-tight">
              {t("verifyPageTitle")}
            </h2>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              {t("verifyPageSubtitle", { email })}
            </p>

            <div
              className="mt-8 flex justify-center gap-2 sm:gap-3"
              onPaste={handlePaste}
            >
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  aria-label={t("verifyOtpDigitLabel", { n: i + 1 })}
                  className={cn(
                    "border-input bg-background text-foreground focus-visible:border-ring h-12 w-10 rounded-lg border text-center text-lg font-semibold tabular-nums outline-none sm:h-14 sm:w-12",
                    otpError && "border-destructive ring-destructive/20 ring-2",
                  )}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                />
              ))}
            </div>

            {resendBanner ? (
              <div
                className="mt-6 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-200"
                role="status"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                {t("verifyResendSuccess")}
              </div>
            ) : null}

            {otpError && !otpExpired ? (
              <div
                className="text-destructive mt-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm dark:border-red-900/50 dark:bg-red-950/40"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {t("verifyInvalidCode")}
              </div>
            ) : null}

            {otpExpired ? (
              <div
                className="bg-muted text-muted-foreground mt-6 flex flex-col gap-2 rounded-lg border px-3 py-3 text-sm"
                role="status"
              >
                <p>{t("verifyExpired")}</p>
                <button
                  type="button"
                  onClick={() => void resend()}
                  className="text-primary w-fit text-left text-sm font-medium underline-offset-4 hover:underline"
                >
                  {t("verifyRequestNew")}
                </button>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-4 shrink-0" aria-hidden />
                {cooldown > 0 ? (
                  <span>
                    {t("verifyResendIn", { time: formatCooldown(cooldown) })}
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={resending}
                    onClick={() => void resend()}
                    className="text-primary font-medium underline-offset-4 hover:underline disabled:opacity-50"
                  >
                    {t("resendVerification")}
                  </button>
                )}
              </div>
              <Link
                href="/register"
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                {t("verifyChangeEmail")}
              </Link>
            </div>

            <Button
              type="button"
              className="mt-8 h-11 w-full"
              disabled={submitting || code.length !== OTP_LENGTH}
              onClick={() => void submitOtp()}
            >
              {submitting ? "…" : t("verifyAccount")}
            </Button>
          </>
        )}
      </div>

      <p className="text-muted-foreground mt-10 text-center text-sm">
        {t("verifyNeedHelp")}{" "}
        <a
          href="mailto:support@etstockx.com"
          className="text-primary inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
        >
          {t("verifyContactSupport")}
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </p>
    </div>
  );
}
