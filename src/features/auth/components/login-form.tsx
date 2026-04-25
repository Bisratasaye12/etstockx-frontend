"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useRouter } from "@/shared/i18n/routing";
import { setAuthError } from "@/features/auth/model/auth-slice";
import { useAppDispatch } from "@/shared/store/hooks";
import { browserApi } from "@/shared/api/browser-api";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function LoginForm() {
  const dispatch = useAppDispatch();
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function mapSigninCodeToMessage(code: string): string {
    switch (code) {
      case "pending_verification":
        return "Your account is pending verification by an administrator.";
      case "email_not_verified":
        return "Please verify your email address before logging in. Check your inbox for the verification link.";
      case "account_locked":
        return "Account is temporarily locked. Please try again later.";
      case "account_rejected":
        return "Your account has been rejected. Please contact support.";
      case "mfa_required":
        return "MFA code is required.";
      case "mfa_invalid":
        return "Invalid MFA code.";
      default:
        return t("loginInvalidCredentials");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    dispatch(setAuthError(null));
    setPending(true);
    try {
      // First call backend login directly so UI can show exact auth errors
      // (pending verification, email not verified, lockout, MFA issues, etc.).
      try {
        await browserApi.post("/v1/auth/login", {
          email,
          password,
          otpCode: otp.trim() ? otp.trim() : null,
        });
      } catch (backendErr) {
        const msg = getApiErrorMessage(backendErr);
        setError(msg);
        dispatch(setAuthError(msg));
        return;
      }

      const res = await signIn("credentials", {
        email,
        password,
        otpCode: otp.trim() ? otp.trim() : null,
        redirect: false,
      });
      if (res?.error) {
        let msg: string | null = null;
        if (res.url) {
          try {
            const code = new URL(
              res.url,
              window.location.origin,
            ).searchParams.get("code");
            if (code) {
              msg = mapSigninCodeToMessage(decodeURIComponent(code));
            }
          } catch {
            // Ignore URL parsing errors and fallback below.
          }
        }
        if (!msg) {
          msg =
            res.error === "CredentialsSignin"
              ? t("loginInvalidCredentials")
              : res.error;
        }
        setError(msg);
        dispatch(setAuthError(msg));
        return;
      }
      if (callbackUrl && callbackUrl.startsWith("/")) {
        router.push(callbackUrl);
        router.refresh();
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center px-6 py-10 md:px-12 lg:px-16">
      <form
        onSubmit={onSubmit}
        className="mx-auto flex w-full max-w-md flex-col gap-8"
        noValidate
      >
        <header className="space-y-2">
          <h2 className="font-heading text-foreground text-2xl font-bold tracking-tight md:text-3xl">
            {t("loginTitle")}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t("loginSubtitle")}
          </p>
        </header>

        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="login-email">{t("loginEmailLabel")}</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={t("loginEmailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password">{t("password")}</Label>
            <div className="relative">
              <Input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 pr-11"
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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                id="remember"
                name="remember"
                className="border-input text-primary size-4 shrink-0 rounded border"
              />
              <span>{t("loginRememberMe")}</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-primary text-sm font-medium underline-offset-4 hover:underline"
            >
              {t("forgotPasswordLink")}
            </Link>
          </div>

          <details className="group">
            <summary className="text-muted-foreground hover:text-foreground cursor-pointer list-none text-sm font-medium [&::-webkit-details-marker]:hidden">
              <span className="underline-offset-4 group-open:underline">
                {t("loginMfaOptional")}
              </span>
            </summary>
            <div className="mt-3 space-y-2">
              <Label htmlFor="login-otp">{t("otp")}</Label>
              <Input
                id="login-otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="h-11"
              />
              <p className="text-muted-foreground text-xs">{t("otpHint")}</p>
            </div>
          </details>
        </div>

        {error ? (
          <div
            className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm"
            role="alert"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <Button
            type="submit"
            size="lg"
            className="h-11 w-full"
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t("loginSigningIn")}
              </>
            ) : (
              t("signInButton")
            )}
          </Button>
        </div>

        <p className="text-muted-foreground text-center text-sm">
          {t("noAccount")}{" "}
          <Link
            href="/register"
            className="text-primary font-semibold underline-offset-4 hover:underline"
          >
            {tNav("register")}
          </Link>
        </p>

        <div className="flex justify-center pt-1">
          <span className="border-border bg-muted/40 text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-medium tracking-wide uppercase">
            <Check
              className="size-3 text-green-600 dark:text-green-500"
              aria-hidden
            />
            {t("loginSslBadge")}
          </span>
        </div>
      </form>
    </div>
  );
}
