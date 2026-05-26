"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ChevronRight,
  Clock,
  Download,
  FileText,
  Landmark,
  Lock,
  Shield,
  User,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { ClientProfile } from "@/shared/api/types";
import { profileKeys } from "@/features/profiles/api/keys";
import { ProfileAvatarUploadField } from "@/features/profiles/components/profile-avatar-upload-field";
import { Link } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { SettlementBankSelect } from "@/features/profiles/components/settlement-bank-select";
import { normalizeRiskProfileForApi } from "@/features/profiles/lib/profile-api-normalize";
import { getApiErrorMessage } from "@/shared/lib/api-error";

type ProfileTab = "personal" | "security" | "bank" | "documents";

type Props = {
  profile: ClientProfile;
};

const panelSurface =
  "rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06)]";

const controlRound = "h-11 rounded-lg border-border";

function splitLegalName(contactPerson: string | null): {
  first: string;
  last: string;
} {
  const s = (contactPerson ?? "").trim();
  if (!s) return { first: "", last: "" };
  const idx = s.indexOf(" ");
  if (idx === -1) return { first: s, last: "" };
  return { first: s.slice(0, idx).trim(), last: s.slice(idx + 1).trim() };
}

function parseAddressParts(full: string | null): {
  line: string;
  city: string;
} {
  if (!full?.trim()) return { line: "", city: "" };
  const parts = full
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (parts.length <= 1) return { line: full.trim(), city: "" };
  const city = parts[parts.length - 1] ?? "";
  const line = parts.slice(0, -1).join(", ");
  return { line, city };
}

export function InvestorMyProfile({ profile }: Props) {
  const { data: session } = useSession();
  const t = useTranslations("investor.profile.myProfile");
  const tc = useTranslations("common");
  const qc = useQueryClient();

  const [tab, setTab] = useState<ProfileTab>("personal");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [preferredLang, setPreferredLang] = useState("en");
  const [settlementBank, setSettlementBank] = useState(
    profile.settlementBank ?? "",
  );

  useEffect(() => {
    const { first, last } = splitLegalName(profile.contactPerson);
    setFirstName(first);
    setLastName(last);
    const { line, city: c } = parseAddressParts(profile.address);
    setAddressLine(line);
    setCity(c);
    setPreferredLang(profile.preferredLang === "am" ? "am" : "en");
    setSettlementBank(profile.settlementBank ?? "");
  }, [profile]);

  const mergedAddress = useMemo(() => {
    const line = addressLine.trim();
    const c = city.trim();
    if (!line && !c) return "";
    if (!c) return line;
    if (!line) return c;
    return `${line}, ${c}`;
  }, [addressLine, city]);

  const personalMutation = useMutation({
    mutationFn: async () => {
      const contactPerson =
        `${firstName.trim()} ${lastName.trim()}`.trim() || null;
      await browserApi.put("/v1/profiles/client/me", {
        contactPerson,
        address: mergedAddress || null,
        preferredLang,
        settlementBank: settlementBank.trim() || null,
        riskProfile: profile.riskProfile?.trim()
          ? normalizeRiskProfileForApi(profile.riskProfile)
          : null,
        accountNickname: profile.accountNickname ?? null,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.clientMe() });
    },
  });

  const lastUpdated = useMemo(() => {
    try {
      return new Date(profile.updatedAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZoneName: "short",
      });
    } catch {
      return "—";
    }
  }, [profile.updatedAt]);

  const memberSince = useMemo(() => {
    try {
      return new Date(profile.createdAt).toLocaleDateString(undefined, {
        dateStyle: "medium",
      });
    } catch {
      return "—";
    }
  }, [profile.createdAt]);

  const activatedDate = useMemo(() => {
    if (!profile.profileCompletedAt) return "—";
    try {
      return new Date(profile.profileCompletedAt).toLocaleDateString(
        undefined,
        {
          dateStyle: "medium",
        },
      );
    } catch {
      return "—";
    }
  }, [profile.profileCompletedAt]);

  function handleDownload() {
    const payload = {
      exportedAt: new Date().toISOString(),
      email: session?.user?.email ?? null,
      profile,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "etstockx-profile-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetPersonalForm() {
    const { first, last } = splitLegalName(profile.contactPerson);
    const { line, city: c } = parseAddressParts(profile.address);
    setFirstName(first);
    setLastName(last);
    setAddressLine(line);
    setCity(c);
    setPreferredLang(profile.preferredLang === "am" ? "am" : "en");
    setSettlementBank(profile.settlementBank ?? "");
  }

  const tabs: {
    id: ProfileTab;
    label: string;
    Icon: typeof User;
  }[] = [
    { id: "personal", label: t("tabPersonal"), Icon: User },
    { id: "security", label: t("tabSecurity"), Icon: Shield },
    { id: "bank", label: t("tabBank"), Icon: Landmark },
    { id: "documents", label: t("tabDocuments"), Icon: FileText },
  ];

  const displayName =
    [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") ||
    profile.contactPerson ||
    session?.user?.email?.split("@")[0] ||
    "—";

  const kycLower = (profile.kycStatus ?? "").toLowerCase();
  const kycPending =
    kycLower.includes("pending") || kycLower.includes("incomplete");

  const isActivated =
    Boolean(session?.user?.isActivated) || Boolean(profile.isProfileComplete);

  return (
    <div className="mx-auto max-w-[1180px] space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-foreground text-[1.75rem] font-bold tracking-tight md:text-[2rem]">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-sm font-normal">
            {t("lastUpdated", { date: lastUpdated })}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="default"
          className="h-10 shrink-0 rounded-lg border-border px-4 font-medium shadow-sm"
          onClick={handleDownload}
        >
          <Download className="size-4" aria-hidden />
          {t("downloadData")}
        </Button>
      </header>

      <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          <div className={cn(panelSurface, "overflow-hidden")}>
            <div className="px-6 pb-6 pt-8">
              <ProfileAvatarUploadField
                userId={profile.userId}
                profileImageUrl={profile.profileImageUrl}
                storagePath={profile.avatarPath}
                fallback={
                  <div
                    className="flex size-full items-center justify-center bg-gradient-to-br from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]"
                    aria-hidden
                  >
                    <UserRound
                      className="size-[52px] text-white/95"
                      strokeWidth={1.25}
                    />
                  </div>
                }
                size="xl"
                layout="stacked"
                className="mb-5"
                invalidateQueryKeys={[profileKeys.clientMe()]}
              />

              <div className="space-y-1 text-center">
                <p className="text-foreground text-xl font-bold tracking-tight">
                  {displayName}
                </p>
                <p className="text-muted-foreground text-sm">
                  {t("roleLabel")}
                </p>
              </div>

              <dl className="mt-6 space-y-3 border-t border-border pt-6">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-muted-foreground shrink-0">
                    {t("accountStatusLabel")}
                  </dt>
                  <dd>
                    <Badge
                      className={cn(
                        "rounded-full px-3 py-0.5 font-semibold",
                        isActivated
                          ? "border-transparent bg-emerald-600 text-white hover:bg-emerald-600"
                          : "border-amber-600/50 bg-amber-500/15 text-amber-900 dark:text-amber-100",
                      )}
                    >
                      {isActivated
                        ? t("accountActivated")
                        : t("accountPending")}
                    </Badge>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-muted-foreground shrink-0">
                    {t("kycStatusLabel")}
                  </dt>
                  <dd>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full gap-1 border px-3 py-0.5 font-semibold",
                        kycPending
                          ? "border-amber-500/70 bg-amber-500/10 text-amber-950 dark:text-amber-50"
                          : "border-border",
                      )}
                    >
                      {kycPending ? (
                        <Clock className="size-3.5 shrink-0" aria-hidden />
                      ) : null}
                      {profile.kycStatus ?? "—"}
                    </Badge>
                  </dd>
                </div>
                <Separator className="my-4 bg-border" />
                <div className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-muted-foreground">{t("memberSince")}</dt>
                  <dd className="text-foreground font-semibold">
                    {memberSince}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-muted-foreground">
                    {t("activationDate")}
                  </dt>
                  <dd className="text-foreground font-semibold">
                    {activatedDate}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <nav
            className={cn(panelSurface, "flex flex-col gap-1 p-2")}
            aria-label={t("profileNavAria")}
          >
            {tabs.map((item) => {
              const active = tab === item.id;
              const Icon = item.Icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition-colors",
                    active
                      ? "bg-primary/12 text-primary ring-primary/20 shadow-sm ring-1"
                      : "text-foreground hover:bg-muted/70",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 shrink-0",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 leading-snug">
                    {item.label}
                  </span>
                  <ChevronRight
                    className={cn(
                      "size-4 shrink-0 opacity-70",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                    aria-hidden
                  />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right column */}
        <div className="min-w-0">
          {tab === "personal" ? (
            <div className={panelSurface}>
              <div className="border-border border-b px-8 py-6">
                <h2 className="text-foreground text-lg font-semibold tracking-tight">
                  {t("personalDetails")}
                </h2>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                  {t("personalDetailsSubtitle")}
                </p>
              </div>

              <div className="space-y-10 px-8 py-8">
                <section className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="fname"
                        className="text-foreground text-sm font-medium"
                      >
                        {t("firstName")}
                      </Label>
                      <Input
                        id="fname"
                        className={cn(controlRound, "bg-muted/40")}
                        value={firstName}
                        disabled
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="lname"
                        className="text-foreground text-sm font-medium"
                      >
                        {t("lastName")}
                      </Label>
                      <Input
                        id="lname"
                        className={cn(controlRound, "bg-muted/40")}
                        value={lastName}
                        disabled
                        readOnly
                      />
                    </div>
                  </div>
                  <p className="text-muted-foreground flex items-start gap-2 text-xs leading-relaxed">
                    <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    {t("legalNameLocked")}
                  </p>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-foreground text-sm font-medium">
                        {t("dateOfBirth")}
                      </Label>
                      <Input
                        className={cn(controlRound, "bg-muted/40")}
                        disabled
                        placeholder="—"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground text-sm font-medium">
                        {t("nationalId")}
                      </Label>
                      <Input
                        className={cn(controlRound, "bg-muted/40")}
                        disabled
                        placeholder="—"
                      />
                    </div>
                  </div>
                </section>

                <Separator />

                <section className="space-y-5">
                  <h3 className="text-foreground text-base font-semibold">
                    {t("contactPrefs")}
                  </h3>
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-foreground text-sm font-medium"
                    >
                      {t("email")}
                    </Label>
                    <Input
                      id="email"
                      className={cn(controlRound, "bg-muted/40")}
                      type="email"
                      value={session?.user?.email ?? ""}
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm font-medium">
                      {t("phone")}
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        className={cn(
                          controlRound,
                          "bg-muted/40 w-[88px] shrink-0",
                        )}
                        disabled
                        value="+251"
                      />
                      <Input
                        className={cn(
                          controlRound,
                          "bg-muted/40 min-w-0 flex-1",
                        )}
                        disabled
                        placeholder={t("phonePlaceholder")}
                      />
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {t("phoneHint")}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="addr"
                      className="text-foreground text-sm font-medium"
                    >
                      {t("residentialAddress")}
                    </Label>
                    <Input
                      id="addr"
                      className={controlRound}
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="city"
                        className="text-foreground text-sm font-medium"
                      >
                        {t("city")}
                      </Label>
                      <Input
                        id="city"
                        className={controlRound}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="lang"
                        className="text-foreground text-sm font-medium"
                      >
                        {t("preferredLang")}
                      </Label>
                      <select
                        id="lang"
                        value={preferredLang}
                        onChange={(e) => setPreferredLang(e.target.value)}
                        className={cn(
                          controlRound,
                          "border-input bg-background w-full px-3 text-sm outline-none",
                          "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]",
                        )}
                      >
                        <option value="en">{t("langEnglish")}</option>
                        <option value="am">{t("langAmharic")}</option>
                      </select>
                    </div>
                  </div>
                </section>

                {personalMutation.isError ? (
                  <p className="text-destructive text-sm" role="alert">
                    {getApiErrorMessage(personalMutation.error)}
                  </p>
                ) : null}

                <div className="border-border flex flex-wrap justify-end gap-3 border-t pt-8">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-lg border-border px-6 font-medium"
                    onClick={resetPersonalForm}
                  >
                    {tc("cancel")}
                  </Button>
                  <Button
                    type="button"
                    className="h-10 rounded-lg px-7 font-semibold shadow-sm"
                    disabled={personalMutation.isPending}
                    onClick={() => personalMutation.mutate()}
                  >
                    {personalMutation.isPending
                      ? tc("loading")
                      : t("saveChanges")}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "security" ? (
            <div className={panelSurface}>
              <div className="border-border border-b px-8 py-6">
                <h2 className="text-lg font-semibold">{t("securityTitle")}</h2>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  {t("securityDesc")}
                </p>
              </div>
              <div className="space-y-5 px-8 py-8">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("securityBody")}
                </p>
                <Link
                  href="/forgot-password"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "h-10 rounded-lg px-6 font-medium",
                  )}
                >
                  {t("resetPassword")}
                </Link>
              </div>
            </div>
          ) : null}

          {tab === "bank" ? (
            <div className={panelSurface}>
              <div className="border-border border-b px-8 py-6">
                <h2 className="text-lg font-semibold">{t("bankTitle")}</h2>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  {t("bankDesc")}
                </p>
              </div>
              <div className="space-y-6 px-8 py-8">
                <div className="space-y-2">
                  <Label
                    htmlFor="bank-main"
                    className="text-foreground text-sm font-medium"
                  >
                    {t("settlementBank")}
                  </Label>
                  <SettlementBankSelect
                    id="bank-main"
                    required
                    value={settlementBank}
                    onChange={setSettlementBank}
                    placeholder={t("bankSelectPlaceholder")}
                    className={cn(controlRound, "max-w-lg")}
                  />
                </div>
                <Button
                  type="button"
                  className="h-10 rounded-lg px-7 font-semibold shadow-sm"
                  disabled={personalMutation.isPending}
                  onClick={() => personalMutation.mutate()}
                >
                  {personalMutation.isPending
                    ? tc("loading")
                    : t("saveChanges")}
                </Button>
              </div>
            </div>
          ) : null}

          {tab === "documents" ? (
            <div className={panelSurface}>
              <div className="border-border border-b px-8 py-6">
                <h2 className="text-lg font-semibold">{t("documentsTitle")}</h2>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  {t("documentsDesc")}
                </p>
              </div>
              <div className="space-y-5 px-8 py-8">
                <Badge
                  variant="outline"
                  className="rounded-full px-3 py-1 font-medium"
                >
                  {profile.kycStatus ?? "—"}
                </Badge>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("documentsBody")}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
