"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock,
  Info,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { browserApi } from "@/shared/api/browser-api";
import type { ResendVerificationRequestDto } from "@/shared/api/dtos/iam";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import { Link } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";

const RESEND_COOLDOWN_SEC = 60;

function formatCooldown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type ConfirmStatus = "loading" | "ok" | "err";

function isBrokerOrDealerRole(role: string | null | undefined): boolean {
  if (!role) return false;
  const r = role.trim().toLowerCase();
  return r === "broker" || r === "dealer";
}

export function ConfirmEmailPanel() {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const searchParams = useSearchParams();
  const tok = searchParams.get("token")?.trim() ?? "";
  const email = searchParams.get("email")?.trim() ?? "";
  const roleFromUrl = searchParams.get("role")?.trim() ?? "";

  const [status, setStatus] = useState<ConfirmStatus>("loading");
  const [detailMessage, setDetailMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const missingParams = !tok || !email;
  const showBrokerPendingBanner =
    status === "ok" && isBrokerOrDealerRole(roleFromUrl);

  useEffect(() => {
    if (missingParams) return;
    let cancelled = false;
    (async () => {
      try {
        await browserApi.get("/v1/auth/confirm-email", {
          params: { token: tok, email },
        });
        if (!cancelled) {
          setStatus("ok");
          setDetailMessage(null);
        }
      } catch (e) {
        if (!cancelled) {
          setStatus("err");
          setDetailMessage(getApiErrorMessage(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [missingParams, tok, email]);

  useEffect(() => {
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
      setCooldown(RESEND_COOLDOWN_SEC);
    } catch (e) {
      setResendError(getApiErrorMessage(e));
    } finally {
      setResending(false);
    }
  }, [email, cooldown, resending]);

  const cardShell =
    "border-border bg-card text-card-foreground mx-auto w-full max-w-md rounded-xl border px-8 py-9 shadow-lg shadow-black/5 md:px-10";

  if (missingParams) {
    return (
      <div className="flex flex-1 flex-col justify-center px-6 py-10 md:px-12 lg:px-16">
        <div className={cn(cardShell, "text-center")}>
          <div className="bg-muted mx-auto flex size-[4.25rem] items-center justify-center rounded-full">
            <AlertCircle className="text-muted-foreground size-9" aria-hidden />
          </div>
          <h2 className="font-heading text-foreground mt-6 text-xl font-bold tracking-tight">
            {t("confirmEmailMissingParamsTitle")}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t("confirmEmailMissingParamsBody")}
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "inline-flex h-11 w-full shrink-0",
              )}
            >
              {tNav("register")}
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "inline-flex h-11 w-full shrink-0",
              )}
            >
              {tNav("signIn")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col justify-center px-6 py-10 md:px-12 lg:px-16">
      <div className={cn(cardShell)}>
        {status === "loading" ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <Loader2
              className="text-muted-foreground size-10 animate-spin"
              aria-hidden
            />
            <p className="text-muted-foreground text-sm">
              {t("confirmEmailConfirming")}
            </p>
          </div>
        ) : status === "ok" ? (
          <div className="flex flex-col gap-8 text-center">
            <div className="bg-green-600 mx-auto flex size-[4.25rem] shrink-0 items-center justify-center rounded-full shadow-sm dark:bg-green-600">
              <Check
                className="size-10 text-white"
                aria-hidden
                strokeWidth={2.75}
              />
            </div>
            <div className="space-y-2">
              <h2 className="font-heading text-foreground text-2xl font-bold tracking-tight">
                {t("confirmEmailSuccessTitle")}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("confirmEmailSuccessBody")}
              </p>
            </div>

            {showBrokerPendingBanner ? (
              <div className="border-blue-100 bg-blue-50 text-left dark:border-blue-900/45 dark:bg-blue-950/35 rounded-xl border px-4 py-4 shadow-sm">
                <div className="flex gap-3">
                  <span className="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 flex size-9 shrink-0 items-center justify-center rounded-full">
                    <Info className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 space-y-2">
                    <p className="text-foreground font-heading text-sm font-bold tracking-tight">
                      {t("confirmEmailBrokerPendingTitle")}
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t("confirmEmailBrokerPendingBody")}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-1.5 text-xs leading-relaxed">
                      <Clock
                        className="size-3.5 shrink-0 opacity-80"
                        aria-hidden
                      />
                      {t("confirmEmailBrokerPendingExpiry")}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg" }),
                "inline-flex h-11 w-full shrink-0 gap-2",
              )}
            >
              {t("confirmEmailProceedLogin")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>

            <Separator />

            <p className="text-muted-foreground text-sm">
              {t("confirmEmailNeedHelp")}{" "}
              <a
                href={`mailto:${t("confirmEmailSupportEmail")}`}
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                {t("confirmEmailContactSupport")}
              </a>
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 text-center">
            <div className="bg-destructive/12 mx-auto flex size-[4.25rem] shrink-0 items-center justify-center rounded-full">
              <AlertCircle
                className="text-destructive size-10"
                aria-hidden
                strokeWidth={2}
              />
            </div>

            <div className="space-y-3">
              <h2 className="font-heading text-foreground text-2xl font-bold tracking-tight">
                {t("confirmEmailErrorTitle")}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("confirmEmailErrorBody")}
              </p>
              {detailMessage ? (
                <p
                  className="text-destructive/90 rounded-md bg-destructive/8 px-2 py-1.5 text-xs"
                  role="status"
                >
                  {detailMessage}
                </p>
              ) : null}
            </div>

            <Button
              type="button"
              size="lg"
              className="h-11 w-full gap-2"
              disabled={cooldown > 0 || resending}
              onClick={() => void resend()}
            >
              {resending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />…
                </>
              ) : (
                <>
                  {t("confirmEmailRequestNewLink")}
                  <RefreshCw className="size-4" aria-hidden />
                </>
              )}
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

            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "inline-flex h-11 w-full shrink-0",
              )}
            >
              {t("confirmEmailReturnLogin")}
            </Link>

            <Separator />

            <p className="text-muted-foreground text-sm">
              {t("confirmEmailNeedHelp")}{" "}
              <a
                href={`mailto:${t("confirmEmailSupportEmail")}`}
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                {t("confirmEmailContactSupport")}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
