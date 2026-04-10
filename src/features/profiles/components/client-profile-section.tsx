"use client";

import { useState } from "react";
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

  const completeMutation = useMutation({
    mutationFn: async () => {
      await browserApi.post("/v1/profiles/client/complete", {
        riskProfile,
        address,
        contactPerson,
        settlementBank,
        accountNickname,
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
            {t("kycStatus")}: {data.kycStatus} · {t("profileComplete")}:{" "}
            <Badge variant={data.isProfileComplete ? "default" : "secondary"}>
              {data.isProfileComplete ? "Yes" : "No"}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-1 text-sm">
          <p>
            {t("address")}: {data.address ?? "—"}
          </p>
          <p>
            {t("riskProfile")}: {data.riskProfile ?? "—"}
          </p>
        </CardContent>
      </Card>

      {!data.isProfileComplete ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("completeTitle")}</CardTitle>
            <CardDescription>{t("completeHint")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="risk">{t("riskProfile")}</Label>
              <Input
                id="risk"
                required
                value={riskProfile}
                onChange={(e) => setRiskProfile(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr">{t("address")}</Label>
              <Input
                id="addr"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp">{t("contactPerson")}</Label>
              <Input
                id="cp"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank">{t("settlementBank")}</Label>
              <Input
                id="bank"
                required
                value={settlementBank}
                onChange={(e) => setSettlementBank(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nick">{t("accountNickname")}</Label>
              <Input
                id="nick"
                required
                value={accountNickname}
                onChange={(e) => setAccountNickname(e.target.value)}
              />
            </div>
            {completeMutation.isError ? (
              <p className="text-destructive text-sm" role="alert">
                {getApiErrorMessage(completeMutation.error)}
              </p>
            ) : null}
            <Button
              type="button"
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? "…" : tc("submit")}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Separator />
      <WatchlistSection />
      <Separator />
      <BrokerDirectorySection />
    </div>
  );
}
