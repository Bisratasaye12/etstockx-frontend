"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock3, Plus, X } from "lucide-react";
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
  const { data, isLoading, error } = useBrokerProfile();
  const qc = useQueryClient();

  const [institution, setInstitution] = useState("");
  const [bio, setBio] = useState("");
  const [licenseDisplay, setLicenseDisplay] = useState("");
  const [logoPath, setLogoPath] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [specializationInput, setSpecializationInput] = useState("");
  const [isAccepting, setIsAccepting] = useState(true);

  useEffect(() => {
    if (data) {
      setInstitution(data.institution ?? "");
      setBio(data.bio ?? "");
      setLicenseDisplay(data.licenseDisplay ?? "");
      setLogoPath(data.logoPath ?? "");
      setSpecializations(data.specializations ?? []);
      setIsAccepting(data.isAcceptingRequests);
    }
  }, [data]);

  const isDirectoryReady = useMemo(() => {
    return Boolean(
      institution.trim() &&
      bio.trim() &&
      licenseDisplay.trim() &&
      specializations.length > 0,
    );
  }, [institution, bio, licenseDisplay, specializations]);

  const bioLength = bio.trim().length;
  const canAddSpecialization =
    specializationInput.trim().length > 0 &&
    !specializations.some(
      (item) => item.toLowerCase() === specializationInput.trim().toLowerCase(),
    );

  const saveMutation = useMutation({
    mutationFn: async () => {
      await browserApi.put("/v1/profiles/broker/me", {
        institution: institution.trim() || null,
        bio: bio.trim() || null,
        licenseDisplay: licenseDisplay.trim() || null,
        logoPath: logoPath.trim() || null,
        specializations,
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

  function addSpecialization() {
    const next = specializationInput.trim();
    if (!next) return;
    if (
      specializations.some((item) => item.toLowerCase() === next.toLowerCase())
    )
      return;
    setSpecializations((prev) => [...prev, next]);
    setSpecializationInput("");
  }

  function removeSpecialization(value: string) {
    setSpecializations((prev) => prev.filter((item) => item !== value));
  }

  return (
    <div className="space-y-5">
      {isDirectoryReady ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <p className="flex items-center gap-2 font-medium text-amber-800">
            <Clock3 className="size-4" />
            {t("brokerPendingTitle")}
          </p>
          <p className="mt-1 text-amber-700">{t("brokerPendingDesc")}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
          <p className="flex items-center gap-2 font-medium text-emerald-700">
            <CheckCircle2 className="size-4" />
            {t("brokerVerifiedTitle")}
          </p>
          <p className="mt-1 text-emerald-700">{t("brokerVerifiedDesc")}</p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <Card>
          <CardHeader>
            <CardTitle>{t("directoryInformation")}</CardTitle>
            <CardDescription>{t("directoryInformationHint")}</CardDescription>
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
              <Label htmlFor="lic">{t("licenseNumber")}</Label>
              <Input
                id="lic"
                value={licenseDisplay}
                onChange={(e) => setLicenseDisplay(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoPath">{t("logoUrl")}</Label>
              <Input
                id="logoPath"
                value={logoPath}
                onChange={(e) => setLogoPath(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="bio">{t("bio")}</Label>
                <span className="text-muted-foreground text-xs">
                  {bioLength}/500
                </span>
              </div>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 500))}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spec-input">{t("specializations")}</Label>
              <div className="flex gap-2">
                <Input
                  id="spec-input"
                  value={specializationInput}
                  onChange={(e) => setSpecializationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSpecialization();
                    }
                  }}
                  placeholder={t("specializationsPlaceholder")}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSpecialization}
                  disabled={!canAddSpecialization}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {specializations.map((item) => (
                  <span
                    key={item}
                    className="bg-muted inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeSpecialization(item)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={t("removeSpecialization")}
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            {saveMutation.isError ? (
              <p className="text-destructive text-sm" role="alert">
                {getApiErrorMessage(saveMutation.error)}
              </p>
            ) : null}
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "…" : t("saveProfileChanges")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("accountCapabilities")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <label className="flex items-center justify-between gap-3">
                <span>{t("acceptingRequests")}</span>
                <input
                  type="checkbox"
                  checked={isAccepting}
                  onChange={(e) => setIsAccepting(e.target.checked)}
                />
              </label>
              <p className="text-muted-foreground text-xs">
                {t("acceptingRequestsHint")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("verificationStatus")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                {t("emailVerified")}
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                {t("documentsSubmitted")}
              </p>
              <p className="flex items-center gap-2">
                {isDirectoryReady ? (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                ) : (
                  <Clock3 className="size-4 text-amber-600" />
                )}
                {isDirectoryReady
                  ? t("complianceApproved")
                  : t("complianceInProgress")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
