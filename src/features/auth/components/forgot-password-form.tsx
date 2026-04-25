"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
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
      /** Align path/body with your API (e.g. ForgotPasswordCommand). */
      await browserApi.post("/v1/auth/forgot-password", { email: trimmed });
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 py-10 md:px-12 lg:px-16">
      <div className="border-border bg-card rounded-2xl border p-6 shadow-sm md:p-8">
        <h2 className="font-heading text-foreground text-2xl font-bold tracking-tight">
          {t("forgotPasswordTitle")}
        </h2>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          {t("forgotPasswordSubtitle")}
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
          <div className="space-y-2">
            <Label htmlFor="forgot-email">
              {t("forgotPasswordEmailLabel")}
            </Label>
            <Input
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="john@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
                setSuccess(false);
              }}
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

          {error ? (
            <div
              id="forgot-email-error"
              className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border px-3 py-2 text-sm"
              role="alert"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {error}
            </div>
          ) : null}

          {success ? (
            <div
              id="forgot-email-success"
              className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-200"
              role="status"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t("forgotPasswordSuccess")}
            </div>
          ) : null}

          <Button
            type="submit"
            className="h-11 w-full"
            size="lg"
            disabled={pending || success}
          >
            {pending ? "…" : t("forgotPasswordSubmit")}
          </Button>
        </form>

        <Link
          href="/login"
          className="text-primary mt-8 inline-flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("forgotPasswordBackToSignIn")}
        </Link>
      </div>
    </div>
  );
}
