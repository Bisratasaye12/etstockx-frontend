"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import { useClientProfile } from "@/features/profiles/api/use-client-profile";
import { profileKeys } from "@/features/profiles/api/keys";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { WatchlistSection } from "@/features/profiles/components/watchlist-section";
import { BrokerDirectorySection } from "@/features/profiles/components/broker-directory-section";
import { getApiErrorMessage } from "@/shared/lib/api-error";

const RISK_PROFILE_OPTIONS = [
  "Conservative",
  "Moderate",
  "Aggressive",
] as const;
const LANGUAGE_OPTIONS = ["en", "am"] as const;

export function ClientProfileSection() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const { data, isLoading, error } = useClientProfile();
  const qc = useQueryClient();

  const [riskProfile, setRiskProfile] = useState("");
  const [address, setAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [settlementBank, setSettlementBank] = useState("");
  const [accountNickname, setAccountNickname] = useState("");
  const [preferredLang, setPreferredLang] = useState("en");

  useEffect(() => {
    if (!data) return;
    setRiskProfile(data.riskProfile ?? "");
    setAddress(data.address ?? "");
    setContactPerson(data.contactPerson ?? "");
    setSettlementBank(data.settlementBank ?? "");
    setAccountNickname(data.accountNickname ?? "");
    setPreferredLang(data.preferredLang === "am" ? "am" : "en");
  }, [data]);

  const hasCompletePayload = useMemo(() => {
    return Boolean(
      riskProfile.trim() &&
      address.trim() &&
      contactPerson.trim() &&
      settlementBank.trim() &&
      accountNickname.trim(),
    );
  }, [riskProfile, address, contactPerson, settlementBank, accountNickname]);

  const completeMutation = useMutation({
    mutationFn: async () => {
      await browserApi.post("/v1/profiles/client/complete", {
        riskProfile: riskProfile.trim(),
        address: address.trim(),
        contactPerson: contactPerson.trim(),
        settlementBank: settlementBank.trim(),
        accountNickname: accountNickname.trim(),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.clientMe() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await browserApi.put("/v1/profiles/client/me", {
        riskProfile: riskProfile.trim() || null,
        address: address.trim() || null,
        contactPerson: contactPerson.trim() || null,
        settlementBank: settlementBank.trim() || null,
        accountNickname: accountNickname.trim() || null,
        preferredLang: preferredLang || null,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.clientMe() });
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">{tc("loading")}</p>;
  }
  if (error) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {getApiErrorMessage(error)}
      </p>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{t("clientTitle")}</CardTitle>
          <CardDescription>
            {t("kycStatus")}: {data.kycStatus ?? "—"} · {t("profileComplete")}:{" "}
            <Badge variant={data.isProfileComplete ? "default" : "secondary"}>
              {data.isProfileComplete ? t("completeYes") : t("completeNo")}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="text-foreground font-medium">{t("address")}:</span>{" "}
            {data.address ?? "—"}
          </p>
          <p>
            <span className="text-foreground font-medium">
              {t("riskProfile")}:
            </span>{" "}
            {data.riskProfile ?? "—"}
          </p>
          <p>
            <span className="text-foreground font-medium">
              {t("settlementBank")}:
            </span>{" "}
            {data.settlementBank ?? "—"}
          </p>
          <p>
            <span className="text-foreground font-medium">
              {t("accountNickname")}:
            </span>{" "}
            {data.accountNickname ?? "—"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {data.isProfileComplete ? t("editTitle") : t("completeTitle")}
          </CardTitle>
          <CardDescription>
            {data.isProfileComplete ? t("editHint") : t("completeHint")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("riskProfile")}</Label>
            <div className="flex flex-wrap gap-2">
              {RISK_PROFILE_OPTIONS.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={riskProfile === option ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRiskProfile(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="addr">{t("address")}</Label>
              <Input
                id="addr"
                required={!data.isProfileComplete}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp">{t("contactPerson")}</Label>
              <Input
                id="cp"
                required={!data.isProfileComplete}
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank">{t("settlementBank")}</Label>
              <Input
                id="bank"
                required={!data.isProfileComplete}
                value={settlementBank}
                onChange={(e) => setSettlementBank(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nick">{t("accountNickname")}</Label>
              <Input
                id="nick"
                required={!data.isProfileComplete}
                value={accountNickname}
                onChange={(e) => setAccountNickname(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pref-lang">{t("preferredLang")}</Label>
              <div className="flex gap-2">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <Button
                    key={lang}
                    type="button"
                    variant={preferredLang === lang ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreferredLang(lang)}
                  >
                    {lang.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          {completeMutation.isError ? (
            <p className="text-destructive text-sm" role="alert">
              {getApiErrorMessage(completeMutation.error)}
            </p>
          ) : null}
          {updateMutation.isError ? (
            <p className="text-destructive text-sm" role="alert">
              {getApiErrorMessage(updateMutation.error)}
            </p>
          ) : null}
          {!data.isProfileComplete ? (
            <Button
              type="button"
              onClick={() => completeMutation.mutate()}
              disabled={!hasCompletePayload || completeMutation.isPending}
            >
              {completeMutation.isPending ? "…" : t("activateInvestor")}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "…" : tc("save")}
            </Button>
          )}
        </CardContent>
      </Card>

      <Separator />
      <WatchlistSection />
      <Separator />
      <BrokerDirectorySection />
    </div>
  );
}
