"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { Lock } from "lucide-react";
import { useChangePassword } from "@/features/broker/api/use-change-password";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { PasswordInputWithToggle } from "@/shared/ui/password-input-with-toggle";
import { cn } from "@/shared/lib/utils";

const panelSurface =
  "rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06)]";

export function BrokerChangePasswordScreen() {
  const t = useTranslations("broker.profile.changePassword");
  const tAuth = useTranslations("auth");
  const tc = useTranslations("common");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutation = useChangePassword();

  function resetForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setLocalError(null);
    setSuccess(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setLocalError(t("mismatch"));
      return;
    }

    mutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setLocalError(null);
          setSuccess(true);
        },
      },
    );
  }

  return (
    <div className={panelSurface}>
      <div className="border-border border-b px-6 py-5 md:px-8 md:py-6">
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
            <Lock className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {t("cardTitle")}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              {t("cardDescription")}
            </p>
          </div>
        </div>
      </div>

      <form
        className="space-y-6 px-6 py-6 md:px-8 md:py-8"
        onSubmit={handleSubmit}
      >
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t("rulesHint")}
        </p>

        {success ? (
          <p
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100"
            role="status"
          >
            {t("success")}
          </p>
        ) : null}

        {localError ? (
          <p className="text-destructive text-sm" role="alert">
            {localError}
          </p>
        ) : null}

        {mutation.isError ? (
          <p className="text-destructive text-sm" role="alert">
            {getApiErrorMessage(mutation.error)}
          </p>
        ) : null}

        <div className="grid max-w-lg gap-5">
          <div className="space-y-2">
            <Label htmlFor="broker-cpw-current" className="text-sm font-medium">
              {t("currentPassword")}
            </Label>
            <PasswordInputWithToggle
              id="broker-cpw-current"
              name="currentPassword"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (success) setSuccess(false);
              }}
              className="h-11 rounded-lg"
              required
              showPasswordLabel={tAuth("loginShowPassword")}
              hidePasswordLabel={tAuth("loginHidePassword")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="broker-cpw-new" className="text-sm font-medium">
              {t("newPassword")}
            </Label>
            <PasswordInputWithToggle
              id="broker-cpw-new"
              name="newPassword"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-11 rounded-lg"
              required
              minLength={8}
              showPasswordLabel={tAuth("loginShowPassword")}
              hidePasswordLabel={tAuth("loginHidePassword")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="broker-cpw-confirm" className="text-sm font-medium">
              {t("confirmPassword")}
            </Label>
            <PasswordInputWithToggle
              id="broker-cpw-confirm"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 rounded-lg"
              required
              minLength={8}
              showPasswordLabel={tAuth("loginShowPassword")}
              hidePasswordLabel={tAuth("loginHidePassword")}
            />
          </div>
        </div>

        <div className="border-border flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/forgot-password"
            className={cn(
              buttonVariants({ variant: "link" }),
              "text-muted-foreground h-auto px-0 text-sm font-normal",
            )}
          >
            {t("forgotLink")}
          </Link>
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-lg px-6 font-medium"
              onClick={resetForm}
              disabled={mutation.isPending}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="submit"
              className="h-10 rounded-lg px-7 font-semibold shadow-sm"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? t("submitting") : t("submit")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
