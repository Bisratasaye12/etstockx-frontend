"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Eye,
  EyeOff,
  Info,
  Loader2,
} from "lucide-react";
import { Link } from "@/shared/i18n/routing";
import { browserApi } from "@/shared/api/browser-api";
import type { ResetPasswordRequestDto } from "@/shared/api/dtos/iam";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { cn } from "@/shared/lib/utils";

function passwordMeetsApiRules(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

export function ResetPasswordPanel() {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [clientErrors, setClientErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const missingToken = !token;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    const errs: string[] = [];
    if (!passwordMeetsApiRules(password)) {
      errs.push(t("passwordRulesHint"));
    }
    if (password !== confirmPassword) {
      errs.push(t("passwordMismatch"));
    }
    if (errs.length > 0) {
      setClientErrors(errs);
      return;
    }
    setClientErrors([]);

    setPending(true);
    try {
      const body: ResetPasswordRequestDto = { token, newPassword: password };
      await browserApi.post("/v1/auth/reset-password", body);
      setSuccess(true);
    } catch (err) {
      setApiError(getApiErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  const labelClass =
    "text-muted-foreground text-xs font-semibold uppercase tracking-wide";

  const footerHelp = (
    <div className="text-muted-foreground mt-10 flex w-full flex-wrap items-center justify-center gap-6 text-sm">
      <a
        href={`mailto:${t("confirmEmailSupportEmail")}`}
        className="hover:text-foreground inline-flex items-center gap-2 transition-colors"
      >
        <CircleHelp className="size-4 shrink-0" aria-hidden />
        {tNav("helpCenter")}
      </a>
      <LocaleSwitcher />
    </div>
  );

  const cardWrapClass =
    "border-border bg-card mx-auto w-full max-w-xl rounded-2xl border p-6 shadow-sm md:p-8";

  if (missingToken) {
    return (
      <div className="flex flex-1 flex-col justify-center px-6 py-10 md:px-12 lg:px-16">
        <div className={cn(cardWrapClass, "text-center")}>
          <div className="bg-muted mx-auto flex size-14 items-center justify-center rounded-full">
            <AlertCircle className="text-muted-foreground size-7" aria-hidden />
          </div>
          <h2 className="font-heading text-foreground mt-5 text-xl font-bold tracking-tight">
            {t("resetPasswordMissingTokenTitle")}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t("resetPasswordMissingTokenBody")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/forgot-password"
              className={cn(
                buttonVariants({ size: "lg" }),
                "inline-flex h-11 shrink-0 justify-center",
              )}
            >
              {t("forgotPasswordSubmit")}
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "inline-flex h-11 shrink-0 justify-center",
              )}
            >
              {t("confirmEmailReturnLogin")}
            </Link>
          </div>
        </div>
        {footerHelp}
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-1 flex-col justify-center px-6 py-10 md:px-12 lg:px-16">
        <div
          className="flex flex-col gap-8 border border-green-200 bg-green-50 px-5 py-4 text-green-900 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-100 max-w-xl mx-auto w-full rounded-xl"
          role="status"
        >
          <div className="flex gap-3">
            <CheckCircle2
              className="mt-0.5 size-5 shrink-0 text-green-600 dark:text-green-400"
              aria-hidden
            />
            <div className="min-w-0 space-y-1">
              <p className="font-heading text-green-900 text-base font-semibold dark:text-green-100">
                {t("resetPasswordSuccessTitle")}
              </p>
              <p className="text-sm leading-relaxed opacity-95">
                {t("resetPasswordSuccessBody")}
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="text-green-700 dark:text-green-300 inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline ml-8"
          >
            {t("resetPasswordProceedLogin")}
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
        {footerHelp}
      </div>
    );
  }

  const showCombinedError = clientErrors.length > 0 || apiError !== null;

  return (
    <div className="flex flex-1 flex-col justify-center px-6 py-10 md:px-12 lg:px-16">
      <div className={cardWrapClass}>
        <h2 className="font-heading text-foreground text-2xl font-bold tracking-tight">
          {t("resetPasswordTitle")}
        </h2>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          {t("resetPasswordSubtitle")}
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
          <div className="space-y-2">
            <Label htmlFor="reset-new-password" className={labelClass}>
              {t("resetPasswordNewLabel")}
            </Label>
            <div className="relative">
              <Input
                id="reset-new-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setClientErrors([]);
                  setApiError(null);
                }}
                className="h-11 pr-11"
                aria-invalid={showCombinedError ? true : undefined}
              />
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 transition-colors"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword ? t("loginHidePassword") : t("loginShowPassword")
                }
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden />
                ) : (
                  <Eye className="size-4" aria-hidden />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-confirm-password" className={labelClass}>
              {t("resetPasswordConfirmLabel")}
            </Label>
            <div className="relative">
              <Input
                id="reset-confirm-password"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setClientErrors([]);
                  setApiError(null);
                }}
                className="h-11 pr-11"
              />
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 transition-colors"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={
                  showConfirm ? t("loginHidePassword") : t("loginShowPassword")
                }
              >
                {showConfirm ? (
                  <EyeOff className="size-4" aria-hidden />
                ) : (
                  <Eye className="size-4" aria-hidden />
                )}
              </button>
            </div>
          </div>

          <p
            id="reset-password-rules"
            className="text-muted-foreground flex gap-2 text-sm leading-relaxed"
          >
            <Info
              className="mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-400"
              aria-hidden
            />
            <span>{t("registerPasswordRulesClient")}</span>
          </p>

          <Button
            type="submit"
            className="h-11 w-full gap-2"
            size="lg"
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t("resetPasswordUpdating")}
              </>
            ) : (
              <>
                {t("resetPasswordSubmit")}
                <ChevronRight className="size-4" aria-hidden />
              </>
            )}
          </Button>
        </form>
      </div>

      {showCombinedError ? (
        <div
          className="border-destructive/30 bg-destructive/10 text-destructive mx-auto mt-6 w-full max-w-xl rounded-lg border px-4 py-3 text-sm max-h-none"
          role="alert"
          aria-live="polite"
        >
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div className="min-w-0 space-y-2">
              <p className="font-semibold">
                {t("resetPasswordValidationTitle")}
              </p>
              <ul className="list-disc space-y-1 pl-4 marker:text-current">
                {clientErrors.map((line) => (
                  <li key={line}>{line}</li>
                ))}
                {apiError ? <li key="api">{apiError}</li> : null}
              </ul>
              {apiError ? (
                <p className="text-destructive/90 pt-1 text-xs leading-relaxed">
                  {t("resetPasswordExpiryHint")}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {footerHelp}
    </div>
  );
}
