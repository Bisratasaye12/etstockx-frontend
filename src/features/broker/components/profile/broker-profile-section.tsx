"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleHelp,
  Pencil,
  Plus,
  Radio,
  X,
} from "lucide-react";
import { Link } from "@/shared/i18n/routing";
import { browserApi } from "@/shared/api/browser-api";
import { getPublicApiBaseUrl } from "@/shared/config/env";
import { useBrokerProfile } from "@/features/broker/api/use-broker-profile";
import { brokerKeys } from "@/features/broker/api/keys";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { cn } from "@/shared/lib/utils";

const panelSurface =
  "rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06)]";

export function BrokerProfileSection() {
  const t = useTranslations("profile");
  const tb = useTranslations("broker.profile");
  const { data, isLoading, error } = useBrokerProfile();
  const qc = useQueryClient();

  function focusLogoUrlField() {
    document.getElementById("broker-logo-url")?.focus();
  }

  function focusSpecField() {
    document.getElementById("broker-spec")?.focus();
  }

  const [institution, setInstitution] = useState("");
  const [bio, setBio] = useState("");
  const [licenseDisplay, setLicenseDisplay] = useState("");
  const [logoPath, setLogoPath] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [specializationInput, setSpecializationInput] = useState("");
  const [isAccepting, setIsAccepting] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  const bioLength = bio.trim().length;
  const canAddSpecialization =
    specializationInput.trim().length > 0 &&
    !specializations.some(
      (item) => item.toLowerCase() === specializationInput.trim().toLowerCase(),
    );

  const logoPreviewUrl = useMemo(() => {
    const raw = logoPath.trim();
    if (!raw) return null;
    const u = raw.replace(/\\/g, "/");
    if (u.startsWith("http://") || u.startsWith("https://")) return u;

    const base = getPublicApiBaseUrl().replace(/\/$/, "");
    if (!base) return null;

    if (u.startsWith("/")) return `${base}${u}`;
    return `${base}/${u}`;
  }, [logoPath]);

  async function putBrokerProfile(nextAccepting: boolean) {
    await browserApi.put("/v1/profiles/broker/me", {
      institution: institution.trim() || null,
      bio: bio.trim() || null,
      licenseDisplay: licenseDisplay.trim() || null,
      logoPath: logoPath.trim() || null,
      specializations,
      isAcceptingRequests: nextAccepting,
    });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      await putBrokerProfile(isAccepting);
    },
    onMutate: () => {
      setSaveSuccess(false);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: brokerKeys.brokerProfile() });
      setSaveSuccess(true);
    },
  });

  const toggleAcceptingMutation = useMutation({
    mutationFn: async (next: boolean) => {
      await putBrokerProfile(next);
    },
    onMutate: (next) => {
      dismissSaveSuccess();
      const previous = isAccepting;
      setIsAccepting(next);
      return { previous };
    },
    onError: (_err, _next, context) => {
      if (context?.previous !== undefined) {
        setIsAccepting(context.previous);
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: brokerKeys.brokerProfile() });
    },
  });

  function dismissSaveSuccess() {
    setSaveSuccess(false);
  }

  function discardChanges() {
    if (!data) return;
    dismissSaveSuccess();
    setInstitution(data.institution ?? "");
    setBio(data.bio ?? "");
    setLicenseDisplay(data.licenseDisplay ?? "");
    setLogoPath(data.logoPath ?? "");
    setSpecializations(data.specializations ?? []);
    setIsAccepting(data.isAcceptingRequests);
    setSpecializationInput("");
  }

  if (isLoading) return <p className="text-muted-foreground text-sm">…</p>;
  if (error) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {getApiErrorMessage(error)}
      </p>
    );
  }

  function addSpecialization() {
    dismissSaveSuccess();
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
    dismissSaveSuccess();
    setSpecializations((prev) => prev.filter((item) => item !== value));
  }

  return (
    <div className="space-y-6">
      {saveSuccess ? (
        <p
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100"
          role="status"
        >
          {t("brokerProfileSaved")}
        </p>
      ) : null}

      {/* Accepting requests */}
      <div className={panelSurface}>
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <span className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl">
              <Radio className="size-6" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-base font-semibold tracking-tight">
                {tb("acceptingCardTitle")}
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {tb("acceptingCardDesc")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:pl-4">
            <button
              type="button"
              role="switch"
              aria-checked={isAccepting}
              aria-label={tb("acceptingCardTitle")}
              disabled={
                toggleAcceptingMutation.isPending || saveMutation.isPending
              }
              onClick={() => {
                const next = !isAccepting;
                toggleAcceptingMutation.mutate(next);
              }}
              className={cn(
                "border-border relative inline-flex h-9 w-[4.25rem] shrink-0 items-center rounded-full border transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60",
                isAccepting ? "bg-primary border-primary" : "bg-muted",
              )}
            >
              <span
                className={cn(
                  "bg-background pointer-events-none absolute top-1/2 size-7 -translate-y-1/2 rounded-full shadow-md ring-1 ring-black/5 transition-[left]",
                  isAccepting ? "left-[calc(100%-1.75rem-0.25rem)]" : "left-1",
                )}
              />
            </button>
            <span
              className={cn(
                "text-xs font-bold tracking-wide",
                isAccepting ? "text-primary" : "text-muted-foreground",
              )}
            >
              {isAccepting ? tb("toggleOpen") : tb("toggleClosed")}
            </span>
          </div>
        </div>
        {toggleAcceptingMutation.isError ? (
          <div className="border-border border-t px-5 py-3 sm:px-8">
            <p className="text-destructive text-sm" role="alert">
              {getApiErrorMessage(toggleAcceptingMutation.error)}
            </p>
          </div>
        ) : null}
      </div>

      {/* Professional details */}
      <div className={panelSurface}>
        <div className="border-border border-b px-5 py-5 sm:px-8 sm:py-6">
          <h2 className="text-lg font-semibold tracking-tight">
            {tb("professionalDetails")}
          </h2>
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-8 sm:py-8">
          {/* Logo */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="relative mx-auto shrink-0 sm:mx-0">
              <div className="border-border bg-muted/40 flex size-28 items-center justify-center overflow-hidden rounded-full border-2 border-dashed">
                {logoPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- user-supplied arbitrary URL
                  <img
                    src={logoPreviewUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <Building2
                    className="text-muted-foreground size-12"
                    aria-hidden
                  />
                )}
              </div>
              <button
                type="button"
                className="border-background bg-primary text-primary-foreground absolute -right-1 bottom-0 flex size-9 items-center justify-center rounded-full border-2 shadow-md"
                onClick={focusLogoUrlField}
                aria-label={tb("logoUploadCta")}
              >
                <Pencil className="size-4" aria-hidden />
              </button>
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg font-medium"
                onClick={focusLogoUrlField}
              >
                {tb("logoUploadCta")}
              </Button>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {tb("logoHint")}
              </p>
              <div className="space-y-2">
                <Label
                  htmlFor="broker-logo-url"
                  className="text-sm font-medium"
                >
                  {tb("logoUrlLabel")}
                </Label>
                <Input
                  id="broker-logo-url"
                  value={logoPath}
                  onChange={(e) => {
                    setLogoPath(e.target.value);
                    dismissSaveSuccess();
                  }}
                  placeholder="https://example.com/logo.png"
                  className="h-11 max-w-lg rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="broker-inst" className="text-sm font-medium">
                {tb("firmNameLabel")}
              </Label>
              <Input
                id="broker-inst"
                value={institution}
                onChange={(e) => {
                  setInstitution(e.target.value);
                  dismissSaveSuccess();
                }}
                className="h-11 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="broker-lic" className="text-sm font-medium">
                {tb("licenseLabel")}
              </Label>
              <div className="relative max-w-lg">
                <Input
                  id="broker-lic"
                  value={licenseDisplay}
                  onChange={(e) => {
                    setLicenseDisplay(e.target.value);
                    dismissSaveSuccess();
                  }}
                  className="h-11 rounded-lg pr-11"
                />
                {licenseDisplay.trim() ? (
                  <CheckCircle2
                    className="text-primary pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2"
                    aria-hidden
                  />
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="broker-bio" className="text-sm font-medium">
                  {tb("professionalBio")}
                </Label>
                <span className="text-muted-foreground text-xs">
                  {tb("bioChars", { count: bioLength })}
                </span>
              </div>
              <Textarea
                id="broker-bio"
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value.slice(0, 500));
                  dismissSaveSuccess();
                }}
                rows={6}
                className="min-h-[140px] resize-y rounded-lg"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="broker-spec" className="text-sm font-medium">
                {tb("marketSpecializations")}
              </Label>
              <div className="flex flex-wrap items-center gap-2">
                {specializations.map((item) => (
                  <span
                    key={item}
                    className="border-primary/25 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeSpecialization(item)}
                      className="hover:bg-primary/15 rounded-full p-0.5"
                      aria-label={t("removeSpecialization")}
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={focusSpecField}
                  className="border-primary/40 text-primary hover:bg-primary/5 inline-flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-sm font-medium transition-colors"
                >
                  <Plus className="size-4" aria-hidden />
                  {tb("addSpecialization")}
                </button>
              </div>
              <div className="flex max-w-lg gap-2">
                <Input
                  id="broker-spec"
                  value={specializationInput}
                  onChange={(e) => {
                    setSpecializationInput(e.target.value);
                    dismissSaveSuccess();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSpecialization();
                    }
                  }}
                  placeholder={t("specializationsPlaceholder")}
                  className="h-11 flex-1 rounded-lg"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addSpecialization}
                  disabled={!canAddSpecialization}
                  className="h-11 shrink-0 rounded-lg px-4"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {saveMutation.isError ? (
            <p className="text-destructive text-sm" role="alert">
              {getApiErrorMessage(saveMutation.error)}
            </p>
          ) : null}

          <div className="border-border flex flex-wrap items-center justify-end gap-4 border-t pt-6">
            <button
              type="button"
              onClick={discardChanges}
              disabled={saveMutation.isPending}
              className="text-muted-foreground hover:text-foreground text-sm font-medium underline-offset-4 hover:underline"
            >
              {tb("discardChanges")}
            </button>
            <Button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="h-11 gap-2 rounded-lg px-6 font-semibold shadow-sm"
            >
              {saveMutation.isPending ? tb("saving") : tb("saveProfile")}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>

      <p className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm">
        <CircleHelp className="size-4 shrink-0" aria-hidden />
        <span>{tb("footerHelp")}</span>
        <Link
          href="mailto:support@etstockx.com"
          className="text-primary font-semibold underline-offset-4 hover:underline"
        >
          {tb("footerSupport")}
        </Link>
      </p>
    </div>
  );
}
