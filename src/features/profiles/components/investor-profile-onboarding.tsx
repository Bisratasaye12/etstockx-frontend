"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Check, Info, X } from "lucide-react";
import { useRouter } from "@/shared/i18n/routing";
import { Link } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";
import { browserApi } from "@/shared/api/browser-api";
import type { ClientProfile } from "@/shared/api/types";
import { profileKeys } from "@/features/profiles/api/keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { buttonVariants } from "@/shared/ui/button";
import { ETHIOPIAN_BANK_OPTIONS } from "@/features/profiles/constants/ethiopian-banks";
import {
  normalizeRiskProfileForApi,
  resolveAccountNicknameForComplete,
} from "@/features/profiles/lib/profile-api-normalize";
import { getApiErrorMessage } from "@/shared/lib/api-error";

const RISK_CARDS = [
  {
    key: "Conservative",
    descKey: "riskConservativeDesc" as const,
  },
  {
    key: "Moderate",
    descKey: "riskModerateDesc" as const,
  },
  {
    key: "Growth",
    descKey: "riskGrowthDesc" as const,
  },
  {
    key: "Aggressive",
    descKey: "riskAggressiveDesc" as const,
  },
] as const;

type Props = {
  profile: ClientProfile;
};

export function InvestorProfileOnboarding({ profile }: Props) {
  const t = useTranslations("investor.profile.onboarding");
  const tc = useTranslations("common");
  const router = useRouter();
  const qc = useQueryClient();
  const { update: updateSession } = useSession();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [legalName, setLegalName] = useState(profile.contactPerson ?? "");
  const [accountNickname, setAccountNickname] = useState(
    profile.accountNickname ?? "",
  );
  const [address, setAddress] = useState(profile.address ?? "");
  const [settlementBank, setSettlementBank] = useState(
    profile.settlementBank ?? "",
  );
  const [riskProfile, setRiskProfile] = useState(profile.riskProfile ?? "");

  const canActivate = useMemo(() => {
    return Boolean(
      legalName.trim() &&
      address.trim() &&
      settlementBank.trim() &&
      riskProfile.trim(),
    );
  }, [legalName, address, settlementBank, riskProfile]);

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const riskApi = riskProfile.trim()
        ? normalizeRiskProfileForApi(riskProfile)
        : null;
      await browserApi.put("/v1/profiles/client/me", {
        riskProfile: riskApi,
        address: address.trim() || null,
        contactPerson: legalName.trim() || null,
        settlementBank: settlementBank.trim() || null,
        accountNickname: accountNickname.trim() || null,
        preferredLang: profile.preferredLang || "en",
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.clientMe() });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      await browserApi.post("/v1/profiles/client/complete", {
        riskProfile: normalizeRiskProfileForApi(riskProfile),
        address: address.trim(),
        contactPerson: legalName.trim(),
        settlementBank: settlementBank.trim(),
        accountNickname: resolveAccountNicknameForComplete(
          accountNickname,
          legalName,
        ),
      });
    },
    onSuccess: async () => {
      void qc.invalidateQueries({ queryKey: profileKeys.clientMe() });
      await updateSession({ isActivated: true });
      setStep(3);
    },
  });

  async function handleSaveAndExit() {
    try {
      await saveDraftMutation.mutateAsync();
    } catch {
      /* surface below */
    }
    router.push("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="bg-background border-border flex items-center justify-between rounded-xl border px-4 py-3 shadow-sm md:px-6">
        <Link href="/" className="relative block h-8 w-[140px] shrink-0">
          <Image
            src="/EtStockX.svg"
            alt={tc("appName")}
            fill
            className="object-contain object-left"
            sizes="140px"
            unoptimized
            priority
          />
        </Link>
        <button
          type="button"
          onClick={() => void handleSaveAndExit()}
          disabled={saveDraftMutation.isPending}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground gap-2",
          )}
        >
          <X className="size-4" aria-hidden />
          {t("saveAndExit")}
        </button>
      </div>

      {saveDraftMutation.isError ? (
        <p className="text-destructive text-sm" role="alert">
          {getApiErrorMessage(saveDraftMutation.error)}
        </p>
      ) : null}
      {completeMutation.isError ? (
        <p className="text-destructive text-sm" role="alert">
          {getApiErrorMessage(completeMutation.error)}
        </p>
      ) : null}

      <div className="border-border bg-card mx-auto max-w-3xl rounded-2xl border p-6 shadow-sm md:p-10">
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="flex w-full max-w-md items-center justify-between gap-2">
            <ProfileStepCircle
              n={1}
              variant={step === 1 ? "current" : "done"}
            />
            <StepLine filled={step >= 2} />
            <ProfileStepCircle
              n={2}
              variant={step === 2 ? "current" : step >= 3 ? "done" : "todo"}
            />
            <StepLine filled={step >= 3} />
            <ProfileStepCircle
              n={3}
              variant={step === 3 ? "done" : step === 2 ? "todo" : "todo"}
            />
          </div>
          <p className="text-muted-foreground text-center text-xs">
            {step === 1 && t("step1Hint")}
            {step === 2 && t("step2Hint")}
            {step === 3 && t("step3Hint")}
          </p>
        </div>

        {step === 1 ? (
          <div className="mt-10 space-y-6 text-center">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("step1Body")}
            </p>
            <button
              type="button"
              onClick={() => setStep(2)}
              className={cn(
                buttonVariants({ variant: "default" }),
                "rounded-full px-8",
              )}
            >
              {t("continue")}
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-10 space-y-8">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="legal-name">{t("legalName")}</Label>
                <Input
                  id="legal-name"
                  className="h-11 rounded-lg"
                  placeholder={t("legalNamePlaceholder")}
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="nickname">{t("nickname")}</Label>
                <Input
                  id="nickname"
                  className="h-11 rounded-lg"
                  placeholder={t("nicknamePlaceholder")}
                  value={accountNickname}
                  onChange={(e) => setAccountNickname(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{t("address")}</Label>
              <Input
                id="address"
                className="h-11 rounded-lg"
                placeholder={t("addressPlaceholder")}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank">{t("settlementBank")}</Label>
              <select
                id="bank"
                value={settlementBank}
                onChange={(e) => setSettlementBank(e.target.value)}
                className={cn(
                  "border-input bg-background h-11 w-full rounded-lg border px-3 text-sm outline-none",
                  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
                )}
              >
                <option value="">{t("bankPlaceholder")}</option>
                {ETHIOPIAN_BANK_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <Label>{t("riskSectionTitle")}</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {RISK_CARDS.map(({ key, descKey }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRiskProfile(key)}
                    className={cn(
                      "border-border hover:border-primary/40 rounded-xl border bg-transparent p-4 text-left transition-colors",
                      riskProfile === key &&
                        "border-primary bg-primary/10 ring-primary ring-2",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                          riskProfile === key
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/40",
                        )}
                      >
                        {riskProfile === key ? (
                          <span className="size-1.5 rounded-full bg-white" />
                        ) : null}
                      </span>
                      <span className="space-y-1">
                        <span className="block font-semibold">{key}</span>
                        <span className="text-muted-foreground block text-xs leading-snug">
                          {t(descKey)}
                        </span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" }),
                  "rounded-full px-6",
                )}
              >
                {t("back")}
              </button>
              <button
                type="button"
                disabled={!canActivate || completeMutation.isPending}
                onClick={() => completeMutation.mutate()}
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "rounded-full px-6 disabled:opacity-50",
                )}
              >
                {completeMutation.isPending ? tc("loading") : t("activate")}
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-10 space-y-6 text-center">
            <div className="bg-primary/10 text-primary mx-auto flex size-14 items-center justify-center rounded-full">
              <Check className="size-7" strokeWidth={2.5} aria-hidden />
            </div>
            <h2 className="text-xl font-semibold">{t("successTitle")}</h2>
            <p className="text-muted-foreground text-sm">{t("successBody")}</p>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "inline-flex rounded-full px-8",
              )}
            >
              {t("goDashboard")}
            </Link>
          </div>
        ) : null}
      </div>

      <div className="border-primary/20 bg-primary/5 text-primary mx-auto flex max-w-3xl gap-3 rounded-xl border px-4 py-4 text-sm md:px-5">
        <Info className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="space-y-1">
          <p className="font-semibold">{t("sessionNoticeTitle")}</p>
          <p className="text-primary/90 leading-relaxed">
            {t("sessionNoticeBody")}
          </p>
        </div>
      </div>
    </div>
  );
}

function StepLine({ filled }: { filled: boolean }) {
  return (
    <div
      className={cn(
        "h-0.5 flex-1 rounded-full transition-colors",
        filled ? "bg-primary" : "bg-muted",
      )}
    />
  );
}

function ProfileStepCircle({
  n,
  variant,
}: {
  n: 1 | 2 | 3;
  variant: "todo" | "current" | "done";
}) {
  if (variant === "done") {
    return (
      <div className="bg-emerald-600 flex size-10 shrink-0 items-center justify-center rounded-full text-white">
        <Check className="size-5" strokeWidth={2.5} aria-hidden />
      </div>
    );
  }
  if (variant === "current") {
    return (
      <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
        {n}
      </div>
    );
  }
  return (
    <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
      {n}
    </div>
  );
}
