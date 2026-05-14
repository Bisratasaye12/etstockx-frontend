"use client";

/**
 * Post-login MFA challenge for `POST /api/v1/auth/login`.
 * OpenAPI v1 documents **TOTP only** (authenticator app); there is no SMS MFA
 * or resend endpoint on this API. Setup uses `mfa/enable` → `mfa/confirm`;
 * sign-in always sends the same `otpCode` field.
 */
import Image from "next/image";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import {
  AlertCircle,
  ChevronDown,
  Clock,
  Info,
  Loader2,
  Shield,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/shared/i18n/routing";
import { browserApi } from "@/shared/api/browser-api";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button } from "@/shared/ui/button";
import { useAppDispatch } from "@/shared/store/hooks";
import { setAuthError } from "@/features/auth/model/auth-slice";
import {
  clearLoginMfaPending,
  isLoginMfaPendingFresh,
  readLoginMfaPending,
} from "@/features/auth/lib/login-mfa-pending";
import { MfaLoginTwoStepStepper } from "@/features/auth/components/mfa-login-two-step-stepper";
import { MfaSixDigitFields } from "@/features/auth/components/mfa-six-digit-fields";

export function MfaChallengeScreen() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const callbackUrl = searchParams.get("callbackUrl") ?? "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [gate, setGate] = useState<"loading" | "ready" | "redirect">("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const p = readLoginMfaPending();
    if (!p || !isLoginMfaPendingFresh(p)) {
      clearLoginMfaPending();
      void router.replace("/login");
      setGate("redirect");
      return;
    }
    setPending({ email: p.email, password: p.password });
    setGate("ready");
  }, [router]);

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!pending || otp.length !== 6) {
      setError(t("mfaIncomplete"));
      return;
    }
    setSubmitting(true);
    setError(null);
    dispatch(setAuthError(null));
    try {
      try {
        await browserApi.post("/v1/auth/login", {
          email: pending.email,
          password: pending.password,
          otpCode: otp.trim(),
        });
      } catch (backendErr) {
        const raw = getApiErrorMessage(backendErr);
        const msg = raw.toLowerCase();
        if (
          msg.includes("invalid mfa") ||
          msg.includes("invalid otp") ||
          msg.includes("mfa code") ||
          msg.includes("one-time")
        ) {
          setError(t("mfaIncorrect"));
        } else {
          setError(raw);
        }
        dispatch(setAuthError(raw));
        return;
      }

      const res = await signIn("credentials", {
        email: pending.email,
        password: pending.password,
        otpCode: otp.trim(),
        redirect: false,
      });
      if (res?.error) {
        setError(t("mfaIncorrect"));
        dispatch(setAuthError(t("mfaIncorrect")));
        return;
      }
      clearLoginMfaPending();
      if (callbackUrl && callbackUrl.startsWith("/")) {
        router.push(callbackUrl);
        router.refresh();
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (gate === "loading" || gate === "redirect") {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center p-8 text-sm">
        …
      </div>
    );
  }

  if (!pending) {
    return null;
  }

  const canSubmit = otp.length === 6 && !submitting;

  return (
    <div className="from-muted/40 via-background to-background flex flex-1 flex-col items-center bg-gradient-to-b px-4 py-10">
      <div className="mb-8">
        <div className="relative mx-auto h-10 w-[160px] sm:h-11 sm:w-[180px]">
          <Image
            src="/EtStockX.svg"
            alt={tCommon("appName")}
            fill
            className="object-contain"
            sizes="180px"
            unoptimized
            priority
          />
        </div>
      </div>

      <MfaLoginTwoStepStepper
        labelStep1={t("mfaStepCredentials")}
        labelStep2={t("mfaStepVerification")}
      />

      <div className="border-border bg-card w-full max-w-md rounded-2xl border px-6 py-8 shadow-lg sm:px-10 sm:py-10">
        <div className="bg-primary/10 text-primary mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl">
          <Shield className="size-7" aria-hidden />
        </div>

        <h1 className="text-foreground text-center text-2xl font-bold tracking-tight">
          {t("mfaTotpTitle")}
        </h1>
        <p className="text-muted-foreground mt-2 text-center text-sm leading-relaxed">
          {t("mfaTotpSubtitle")}
        </p>

        <form className="mt-8 space-y-6" onSubmit={onVerify} noValidate>
          <div>
            <p className="text-muted-foreground mb-3 text-center text-[11px] font-semibold tracking-wide uppercase">
              {t("mfaCodeLabel")}
            </p>
            <MfaSixDigitFields
              idPrefix="mfa-login"
              value={otp}
              onChange={(next) => {
                setOtp(next);
                if (error) setError(null);
              }}
              disabled={submitting}
              invalid={Boolean(error)}
            />
          </div>

          {error ? (
            <div
              className="text-destructive flex items-start justify-center gap-2 text-center text-sm"
              role="alert"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="bg-primary/5 border-primary/15 flex gap-3 rounded-xl border px-4 py-3 text-sm">
            <Info className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
            <p className="text-muted-foreground leading-relaxed">
              {t("mfaTotpHint")}
            </p>
          </div>

          <p className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
            <Clock className="size-3.5 shrink-0" aria-hidden />
            {t("mfaTotpRefresh")}
          </p>

          <Button
            type="submit"
            size="lg"
            className="h-12 w-full gap-2 text-base font-semibold"
            disabled={!canSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t("mfaVerifying")}
              </>
            ) : (
              t("mfaVerifyCta")
            )}
          </Button>

          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-primary text-sm font-medium underline-offset-4 hover:underline"
            >
              {t("mfaLostDevice")}
            </Link>
          </div>

          <Link
            href="/login"
            onClick={() => clearLoginMfaPending()}
            className="text-primary block text-center text-sm font-medium underline-offset-4 hover:underline"
          >
            {t("mfaDifferentAccount")}
          </Link>

          <details className="border-border group border-t pt-4">
            <summary className="text-muted-foreground flex cursor-pointer list-none items-center justify-center gap-1 text-sm font-medium [&::-webkit-details-marker]:hidden">
              {t("mfaHelpTitle")}
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
            </summary>
            <p className="text-muted-foreground mt-3 text-center text-xs leading-relaxed">
              {t("mfaHelpBody")}
            </p>
          </details>
        </form>
      </div>

      <p className="text-muted-foreground mt-10 max-w-md text-center text-xs">
        {t("mfaFooterRegulatory")}
      </p>
      <div className="text-muted-foreground mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
        <Link
          href="#terms"
          className="hover:text-foreground underline-offset-2"
        >
          {t("loginFooterTerms")}
        </Link>
        <Link
          href="#privacy"
          className="hover:text-foreground underline-offset-2"
        >
          {t("mfaFooterPrivacy")}
        </Link>
        <Link href="#risk" className="hover:text-foreground underline-offset-2">
          {t("mfaFooterRisk")}
        </Link>
      </div>
    </div>
  );
}
