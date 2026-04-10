"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import { useBrokerProfile } from "@/features/profiles/api/use-broker-profile";
import { profileKeys } from "@/features/profiles/api/keys";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { getApiErrorMessage } from "@/shared/lib/api-error";

export function BrokerProfileSection() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const { data, isLoading, error } = useBrokerProfile();
  const qc = useQueryClient();

  const [institution, setInstitution] = useState("");
  const [bio, setBio] = useState("");
  const [licenseDisplay, setLicenseDisplay] = useState("");
  const [specializations, setSpecializations] = useState("");
  const [isAccepting, setIsAccepting] = useState(true);

  useEffect(() => {
    if (data) {
      setInstitution(data.institution ?? "");
      setBio(data.bio ?? "");
      setLicenseDisplay(data.licenseDisplay ?? "");
      setSpecializations((data.specializations ?? []).join(", "));
      setIsAccepting(data.isAcceptingRequests);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await browserApi.put("/v1/profiles/broker/me", {
        institution: institution || null,
        bio: bio || null,
        licenseDisplay: licenseDisplay || null,
        logoPath: null,
        specializations: specializations
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        isAcceptingRequests: isAccepting,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.brokerMe() });
    },
  });

  if (isLoading) return <p className="text-muted-foreground text-sm">…</p>;
  if (error) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {getApiErrorMessage(error)}
      </p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("brokerTitle")}</CardTitle>
        <CardDescription>{t("bio")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="inst">{t("institution")}</Label>
          <Input
            id="inst"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">{t("bio")}</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lic">{t("licenseNumber")}</Label>
          <Input
            id="lic"
            value={licenseDisplay}
            onChange={(e) => setLicenseDisplay(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="spec">{t("specializations")}</Label>
          <Input
            id="spec"
            value={specializations}
            onChange={(e) => setSpecializations(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isAccepting}
            onChange={(e) => setIsAccepting(e.target.checked)}
          />
          {t("isAccepting")}
        </label>
        {saveMutation.isError ? (
          <p className="text-destructive text-sm">
            {getApiErrorMessage(saveMutation.error)}
          </p>
        ) : null}
        <Button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? "…" : tc("save")}
        </Button>
      </CardContent>
    </Card>
  );
}
