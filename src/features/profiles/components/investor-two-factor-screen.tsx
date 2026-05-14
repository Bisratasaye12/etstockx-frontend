"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  ArrowRight,
  Download,
  Eye,
  EyeOff,
  Info,
  Shield,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Link } from "@/shared/i18n/routing";
import { useConfirmMfa } from "@/features/broker/api/use-confirm-mfa";
import { useDisableMfa } from "@/features/broker/api/use-disable-mfa";
import { useEnableMfa } from "@/features/broker/api/use-enable-mfa";
import { createBrokerTotp } from "@/features/broker/lib/build-broker-totp";
import {
  readBrokerMfaPreference,
  writeBrokerMfaPreference,
} from "@/features/broker/lib/mfa-local-preference";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { BrokerMfaOtpInput } from "@/features/broker/components/profile/broker-mfa-otp-input";
import { BrokerMfaStepper } from "@/features/broker/components/profile/broker-mfa-stepper";

const panelSurface =
  "rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06)]";

type WizardStep = 1 | 2 | 3;

export function InvestorTwoFactorScreen() {
  const t = useTranslations("investor.profileSecurity.twoFactor");
  const tc = useTranslations("common");
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const accountLabel = session?.user?.email?.trim() ?? "";

  const [mfaPref, setMfaPref] = useState<boolean | null>(null);
  const [mode, setMode] = useState<"manage" | "setup">("manage");
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [setupPassword, setSetupPassword] = useState("");
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [manualSecretOpen, setManualSecretOpen] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [showDisablePanel, setShowDisablePanel] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisablePassword, setShowDisablePassword] = useState(false);
  const [disableLocalError, setDisableLocalError] = useState<string | null>(
    null,
  );

  const enableMfa = useEnableMfa();
  const confirmMfa = useConfirmMfa();
  const disableMfa = useDisableMfa();

  useEffect(() => {
    setMfaPref(readBrokerMfaPreference(userId));
  }, [userId]);

  const persistPref = useCallback(
    (enabled: boolean) => {
      if (!userId) return;
      writeBrokerMfaPreference(userId, enabled);
      setMfaPref(enabled);
    },
    [userId],
  );

  const totp = useMemo(() => {
    if (!totpSecret) return null;
    try {
      return createBrokerTotp(totpSecret, accountLabel || "Account");
    } catch {
      return null;
    }
  }, [totpSecret, accountLabel]);

  const otpauthUri = totp?.toString() ?? "";

  function resetWizard() {
    setWizardStep(1);
    setSetupPassword("");
    setTotpSecret(null);
    setOtp("");
    setManualSecretOpen(false);
    setVerifyError(null);
    enableMfa.reset();
    confirmMfa.reset();
    disableMfa.reset();
  }

  function openSetup() {
    resetWizard();
    setMode("setup");
  }

  function exitSetupToManage() {
    resetWizard();
    setMode("manage");
  }

  function onEnableContinue(e: React.FormEvent) {
    e.preventDefault();
    setVerifyError(null);
    if (!setupPassword.trim()) return;

    enableMfa.mutate(
      { password: setupPassword },
      {
        onSuccess: (data) => {
          setTotpSecret(data.secret);
          setWizardStep(2);
        },
        onError: (err) => {
          const msg = getApiErrorMessage(err).toLowerCase();
          if (
            msg.includes("already") &&
            (msg.includes("enabled") || msg.includes("active"))
          ) {
            persistPref(true);
            exitSetupToManage();
            return;
          }
        },
      },
    );
  }

  function onWizardBackFromScan() {
    if (!setupPassword) return;
    disableMfa.mutate(
      { password: setupPassword },
      {
        onSuccess: () => {
          persistPref(false);
          setTotpSecret(null);
          setOtp("");
          setWizardStep(1);
          setVerifyError(null);
        },
      },
    );
  }

  function onConfirmMfa(e: React.FormEvent) {
    e.preventDefault();
    setVerifyError(null);
    if (otp.length !== 6) {
      setVerifyError(t("otpIncomplete"));
      return;
    }

    confirmMfa.mutate(
      { otpCode: otp.trim() },
      {
        onSuccess: () => {
          if (userId) persistPref(true);
          setWizardStep(3);
        },
        onError: (err) => {
          setVerifyError(getApiErrorMessage(err) || t("otpInvalid"));
        },
      },
    );
  }

  function onDisableSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDisableLocalError(null);
    if (!disablePassword.trim()) {
      setDisableLocalError(t("disablePasswordRequired"));
      return;
    }
    disableMfa.mutate(
      { password: disablePassword },
      {
        onSuccess: () => {
          persistPref(false);
          setShowDisablePanel(false);
          setDisablePassword("");
          setDisableLocalError(null);
        },
        onError: (err) => {
          const msg = getApiErrorMessage(err);
          if (msg.toLowerCase().includes("not enabled")) {
            persistPref(false);
            setShowDisablePanel(false);
            setDisablePassword("");
            return;
          }
          setDisableLocalError(msg);
        },
      },
    );
  }

  const mfaEnabled = mfaPref === true;

  return (
    <div className="space-y-6">
      <nav
        className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm"
        aria-label={t("breadcrumbAria")}
      >
        <Link
          href="/profile/client"
          className="text-primary font-medium hover:underline"
        >
          {t("breadcrumbSettings")}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-foreground font-medium">
          {t("breadcrumbSecurity")}
        </span>
      </nav>

      <div>
        <h2 className="text-foreground text-2xl font-bold tracking-tight md:text-[1.75rem]">
          {t("pageTitle")}
        </h2>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          {t("pageDescription")}
        </p>
      </div>

      {mode === "manage" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div className="space-y-6">
            {!mfaEnabled ? (
              <div
                className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-100"
                role="status"
              >
                <p className="max-w-xl leading-relaxed">
                  {t("bannerDisabled")}
                </p>
                <Button
                  type="button"
                  className="h-10 shrink-0 px-5 font-semibold"
                  onClick={openSetup}
                >
                  {t("ctaEnable")}
                </Button>
              </div>
            ) : (
              <div
                className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-950 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-100"
                role="status"
              >
                <div className="flex max-w-xl items-start gap-3">
                  <Shield
                    className="text-emerald-700 dark:text-emerald-300 mt-0.5 size-5 shrink-0"
                    aria-hidden
                  />
                  <p className="leading-relaxed">{t("bannerEnabled")}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10 h-10 shrink-0 px-4 font-semibold"
                  onClick={() => {
                    setShowDisablePanel(true);
                    setDisablePassword("");
                    setDisableLocalError(null);
                  }}
                >
                  {t("ctaDisable")}
                </Button>
              </div>
            )}

            {mfaEnabled && showDisablePanel ? (
              <div
                className="flex flex-col gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-5 text-sm text-red-950 dark:border-red-900/50 dark:bg-red-950/25 dark:text-red-100"
                role="region"
                aria-labelledby="mfa-disable-title"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className="text-red-600 dark:text-red-400 mt-0.5 size-5 shrink-0"
                    aria-hidden
                  />
                  <div>
                    <h3
                      id="mfa-disable-title"
                      className="text-base font-semibold tracking-tight"
                    >
                      {t("disableCardTitle")}
                    </h3>
                    <p className="mt-2 leading-relaxed">
                      {t("disableCardBody")}
                    </p>
                  </div>
                </div>
                <form className="space-y-4" onSubmit={onDisableSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="mfa-disable-pw">
                      {t("disablePasswordLabel")}
                    </Label>
                    <div className="relative max-w-md">
                      <Input
                        id="mfa-disable-pw"
                        type={showDisablePassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={disablePassword}
                        onChange={(e) => setDisablePassword(e.target.value)}
                        className="h-11 pr-11"
                      />
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5"
                        onClick={() => setShowDisablePassword((v) => !v)}
                        aria-label={
                          showDisablePassword
                            ? t("hidePassword")
                            : t("showPassword")
                        }
                      >
                        {showDisablePassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  {disableLocalError ? (
                    <p className="text-destructive text-sm" role="alert">
                      {disableLocalError}
                    </p>
                  ) : null}
                  {disableMfa.isError ? (
                    <p className="text-destructive text-sm" role="alert">
                      {getApiErrorMessage(disableMfa.error)}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="submit"
                      disabled={disableMfa.isPending}
                      className="h-10 bg-red-600 px-5 font-semibold text-white hover:bg-red-700"
                    >
                      {disableMfa.isPending
                        ? t("disableSubmitting")
                        : t("disableConfirm")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 px-5"
                      disabled={disableMfa.isPending}
                      onClick={() => {
                        setShowDisablePanel(false);
                        setDisablePassword("");
                        setDisableLocalError(null);
                      }}
                    >
                      {tc("cancel")}
                    </Button>
                  </div>
                </form>
              </div>
            ) : null}

            <div className={panelSurface}>
              <div className="border-border flex flex-wrap items-start justify-between gap-4 border-b px-5 py-5 md:px-8 md:py-6">
                <div>
                  <h3 className="text-base font-semibold tracking-tight">
                    {t("methodTitle")}
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    {t("methodBody")}
                  </p>
                  {mfaEnabled ? (
                    <p className="text-primary mt-3 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                      <span className="bg-primary size-2 rounded-full" />
                      {t("methodActive")}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex gap-3 rounded-xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-950 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-100">
              <Info
                className="size-5 shrink-0 text-sky-700 dark:text-sky-300"
                aria-hidden
              />
              <div>
                <p className="leading-relaxed">{t("recoveryBody")}</p>
                <span className="text-muted-foreground mt-2 inline-flex items-center gap-2 text-xs font-medium">
                  <Download className="size-3.5 opacity-70" aria-hidden />
                  {t("recoveryUnavailable")}
                </span>
              </div>
            </div>
          </div>

          <aside
            className={cn(
              panelSurface,
              "bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-md lg:sticky lg:top-6",
            )}
          >
            <h3 className="text-lg font-semibold tracking-tight">
              {t("asideTitle")}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-200">
              {t("asideBody")}
            </p>
          </aside>
        </div>
      ) : (
        <div className={panelSurface}>
          <div className="border-border space-y-4 border-b px-5 py-5 md:flex md:flex-row md:items-start md:justify-between md:gap-6 md:px-8 md:py-6">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">
                {t("setupCardTitle")}
              </h3>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                {t("setupCardSubtitle")}
              </p>
            </div>
            <BrokerMfaStepper
              current={wizardStep}
              labelVerify={t("stepVerify")}
              labelSetup={t("stepSetup")}
              labelFinalize={t("stepFinalize")}
            />
          </div>

          <div className="space-y-8 px-5 py-6 md:px-8 md:py-8">
            {wizardStep === 1 ? (
              <form
                className="mx-auto max-w-md space-y-6"
                onSubmit={onEnableContinue}
              >
                <div className="space-y-2">
                  <Label htmlFor="mfa-setup-pw">
                    {t("setupPasswordLabel")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="mfa-setup-pw"
                      type={showSetupPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      className="h-11 pr-11"
                      required
                    />
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5"
                      onClick={() => setShowSetupPassword((v) => !v)}
                      aria-label={
                        showSetupPassword
                          ? t("hidePassword")
                          : t("showPassword")
                      }
                    >
                      {showSetupPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {t("setupPasswordHint")}
                  </p>
                </div>
                {enableMfa.isError ? (
                  <p className="text-destructive text-sm" role="alert">
                    {getApiErrorMessage(enableMfa.error)}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="submit"
                    disabled={enableMfa.isPending}
                    className="h-11 gap-2 px-6 font-semibold"
                  >
                    {enableMfa.isPending ? t("enabling") : t("continue")}
                    <ArrowRight className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    onClick={exitSetupToManage}
                    disabled={enableMfa.isPending}
                  >
                    {tc("cancel")}
                  </Button>
                </div>
              </form>
            ) : null}

            {wizardStep === 2 && totpSecret && !totp ? (
              <p className="text-destructive text-center text-sm" role="alert">
                {t("secretInvalid")}
              </p>
            ) : null}

            {wizardStep === 2 && totp && otpauthUri ? (
              <div className="mx-auto max-w-lg space-y-8">
                <div className="space-y-3 text-center">
                  <h4 className="text-base font-semibold tracking-tight">
                    {t("scanTitle")}
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t("scanBody")}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="border-border bg-background flex size-[200px] items-center justify-center rounded-xl border p-3 shadow-inner">
                    <QRCodeSVG value={otpauthUri} size={176} level="M" />
                  </div>
                  <button
                    type="button"
                    className="text-primary text-sm font-medium underline-offset-4 hover:underline"
                    onClick={() => setManualSecretOpen((v) => !v)}
                  >
                    {manualSecretOpen ? t("manualHide") : t("manualShow")}
                  </button>
                  {manualSecretOpen ? (
                    <div className="bg-muted/60 w-full max-w-md rounded-lg border px-4 py-3 text-center font-mono text-xs break-all">
                      {totp.secret.base32}
                    </div>
                  ) : null}
                </div>

                <form className="space-y-6" onSubmit={onConfirmMfa}>
                  <div className="space-y-3">
                    <Label htmlFor="mfa-otp" className="text-center block">
                      {t("otpLabel")}
                    </Label>
                    <BrokerMfaOtpInput
                      id="mfa-otp"
                      value={otp}
                      onChange={(v) => {
                        setOtp(v);
                        setVerifyError(null);
                      }}
                      disabled={confirmMfa.isPending}
                    />
                    <p className="text-muted-foreground text-center text-xs leading-relaxed">
                      {t("otpHint")}
                    </p>
                  </div>
                  {verifyError ? (
                    <p
                      className="text-destructive text-center text-sm"
                      role="alert"
                    >
                      {verifyError}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 min-w-[7rem]"
                      disabled={disableMfa.isPending}
                      onClick={onWizardBackFromScan}
                    >
                      {t("back")}
                    </Button>
                    <Button
                      type="submit"
                      className="h-11 gap-2 px-6 font-semibold"
                      disabled={confirmMfa.isPending}
                    >
                      {confirmMfa.isPending
                        ? t("confirming")
                        : t("verifyEnable")}
                      <ArrowRight className="size-4" aria-hidden />
                    </Button>
                  </div>
                </form>

                <p className="text-muted-foreground text-center text-xs">
                  {t("totpFooter")}
                </p>
              </div>
            ) : null}

            {wizardStep === 3 ? (
              <div className="mx-auto max-w-xl space-y-6 text-center">
                <div
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-100"
                  role="status"
                >
                  <p className="leading-relaxed">{t("successBody")}</p>
                  <p className="text-primary mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm font-semibold">
                    <span className="text-muted-foreground font-normal">
                      {t("successRecoveryNote")}
                    </span>
                    <Link
                      href="/profile/client/two-factor"
                      className="hover:underline"
                    >
                      {t("successManageLink")}
                    </Link>
                  </p>
                </div>
                <Button
                  type="button"
                  className="h-11 px-8 font-semibold"
                  onClick={() => {
                    resetWizard();
                    setMode("manage");
                  }}
                >
                  {t("done")}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
