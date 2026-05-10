"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { browserApi } from "@/shared/api/browser-api";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Link } from "@/shared/i18n/routing";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const year = new Date().getFullYear();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError(t("forgotPasswordEmailRequired"));
      return;
    }
    if (!isValidEmail(trimmed)) {
      setError(t("forgotPasswordInvalidEmail"));
      return;
    }

    setPending(true);
    try {
      await browserApi.post("/v1/auth/forgot-password", { email: trimmed });
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  const emailLabelClass =
    "text-muted-foreground text-xs font-semibold uppercase tracking-wide";

  return (
    <div className="flex flex-1 flex-col justify-center px-6 py-10 md:px-12 lg:px-16">
      <div className="mx-auto w-full max-w-xl">
        <div className="border-border bg-card rounded-2xl border p-6 shadow-sm md:p-8">
          <h2 className="font-heading text-foreground text-2xl font-bold tracking-tight">
            {t("forgotPasswordTitle")}
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            {t("forgotPasswordSubtitle")}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
            <div className="space-y-2">
              <Label htmlFor="forgot-email" className={emailLabelClass}>
                {t("forgotPasswordEmailLabel")}
              </Label>
              <Input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder={t("forgotPasswordEmailPlaceholder")}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                  setSuccess(false);
                }}
                className="h-11"
                aria-invalid={Boolean(error) || undefined}
                aria-describedby={
                  error
                    ? "forgot-email-error"
                    : success
                      ? "forgot-email-success"
                      : undefined
                }
              />
            </div>

            <Button
              type="submit"
              className="h-11 w-full gap-2"
              size="lg"
              disabled={pending || success}
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {t("forgotPasswordSending")}
                </>
              ) : (
                <>
                  {t("forgotPasswordSubmit")}
                  <ChevronRight className="size-4 shrink-0" aria-hidden />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 flex justify-center">
            <Link
              href="/login"
              className="text-primary hover:text-primary/90 inline-flex items-center gap-2 text-sm font-medium"
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden />
              {t("forgotPasswordBackToSignIn")}
            </Link>
          </div>
        </div>

        {error ? (
          <div
            id="forgot-email-error"
            className="border-destructive/35 bg-destructive/10 text-destructive mt-6 flex items-start gap-2 rounded-lg border px-3 py-3 text-sm"
            role="alert"
          >
            <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
            {error}
          </div>
        ) : null}

        {success ? (
          <div
            id="forgot-email-success"
            className="border-green-200 bg-green-50 text-green-900 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-100 mt-6 flex items-start gap-2 rounded-lg border px-3 py-3 text-sm"
            role="status"
          >
            <CheckCircle2
              className="mt-0.5 size-5 shrink-0 text-green-600 dark:text-green-400"
              aria-hidden
            />
            {t("forgotPasswordSuccess")}
          </div>
        ) : null}

        <p className="text-muted-foreground mt-10 text-center text-xs leading-relaxed">
          {t("verifyRightFooterCopyright", { year })}
        </p>
      </div>
    </div>
  );
}
