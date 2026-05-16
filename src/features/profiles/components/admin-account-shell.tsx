"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Lock, Pencil, Shield, UserRound } from "lucide-react";
import { Link } from "@/shared/i18n/routing";
import { browserApi } from "@/shared/api/browser-api";
import { getPublicApiBaseUrl } from "@/shared/config/env";
import { useAdminProfile } from "@/features/profiles/api/use-admin-profile";
import { profileKeys } from "@/features/profiles/api/keys";
import type { UpdateAdminProfileRequest } from "@/shared/api/types";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { normalizeUserRole } from "@/shared/lib/user-role";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/lib/utils";

const panelSurface =
  "rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06)]";

const controlRound = "h-11 rounded-lg border-border";

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

export function AdminAccountShell() {
  const { data: session, status } = useSession();
  const profileQ = useAdminProfile();
  const qc = useQueryClient();
  const t = useTranslations("admin.profile.account");
  const th = useTranslations("headerProfile");

  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [preferredLang, setPreferredLang] = useState("en");
  const [avatarPath, setAvatarPath] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const profile = profileQ.data;

  useEffect(() => {
    if (!profile) return;
    setDepartment(profile.department ?? "");
    setJobTitle(profile.jobTitle ?? "");
    setPreferredLang(profile.preferredLang === "am" ? "am" : "en");
    setAvatarPath(profile.avatarPath ?? "");
  }, [profile]);

  const email = session?.user?.email ?? "";
  const name = session?.user?.name?.trim() ?? "";
  const role =
    normalizeUserRole(session?.user?.role) ?? session?.user?.role ?? "";

  const roleLabel = useMemo(() => {
    switch (role) {
      case "Admin":
        return th("roleAdmin");
      default:
        return role || th("roleUnknown");
    }
  }, [role, th]);

  const initials = useMemo(() => {
    const src = name || email;
    if (!src) return "A";
    const parts = src.split(/[\s@._-]+/).filter(Boolean);
    return (
      parts
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase())
        .join("") || "A"
    );
  }, [email, name]);

  const avatarPreviewUrl = useMemo(() => {
    const raw = avatarPath.trim();
    if (!raw) return null;
    const u = raw.replace(/\\/g, "/");
    if (u.startsWith("http://") || u.startsWith("https://")) return u;

    const base = getPublicApiBaseUrl().replace(/\/$/, "");
    if (!base) return null;

    if (u.startsWith("/")) return `${base}${u}`;
    return `${base}/${u}`;
  }, [avatarPath]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: UpdateAdminProfileRequest = {
        department: department.trim() || null,
        jobTitle: jobTitle.trim() || null,
        preferredLang,
        avatarPath: avatarPath.trim() || null,
      };
      await browserApi.put("/v1/profiles/admin/me", body);
    },
    onMutate: () => {
      setSaveSuccess(false);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.adminMe() });
      setSaveSuccess(true);
    },
  });

  function dismissSaveSuccess() {
    setSaveSuccess(false);
  }

  function discardChanges() {
    if (!profile) return;
    dismissSaveSuccess();
    setDepartment(profile.department ?? "");
    setJobTitle(profile.jobTitle ?? "");
    setPreferredLang(profile.preferredLang === "am" ? "am" : "en");
    setAvatarPath(profile.avatarPath ?? "");
  }

  function focusAvatarField() {
    document.getElementById("admin-avatar-url")?.focus();
  }

  return (
    <div className="space-y-6">
      <div className={panelSurface}>
        <div className="border-border flex flex-col gap-6 border-b px-6 py-6 md:flex-row md:items-center md:px-8 md:py-8">
          <span className="bg-primary text-primary-foreground relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-bold shadow-inner">
            {avatarPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- user-supplied URL
              <img
                src={avatarPreviewUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : status === "loading" ? (
              "…"
            ) : (
              initials
            )}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {t("signedInLabel")}
            </p>
            <h2 className="text-foreground truncate text-xl font-semibold tracking-tight">
              {name || email || "—"}
            </h2>
            {name ? (
              <p className="text-muted-foreground truncate text-sm">{email}</p>
            ) : null}
            <p className="text-muted-foreground pt-1 text-sm">{roleLabel}</p>
          </div>
        </div>
        <div className="px-6 py-5 md:px-8 md:py-6">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t("securityHint")}
          </p>
        </div>
      </div>

      <section className={panelSurface} aria-labelledby="admin-profile-heading">
        <div className="border-border border-b px-6 py-5 md:px-8 md:py-6">
          <h2
            id="admin-profile-heading"
            className="text-lg font-semibold tracking-tight"
          >
            {t("profileSectionTitle")}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            {t("profileSectionHint")}
          </p>
        </div>

        <div className="space-y-6 px-6 py-5 md:px-8 md:py-6">
          {saveSuccess ? (
            <p
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100"
              role="status"
            >
              {t("saveSuccess")}
            </p>
          ) : null}

          {profileQ.isPending ? (
            <p className="text-muted-foreground text-sm">
              {t("profileLoading")}
            </p>
          ) : null}

          {profileQ.isError ? (
            <div className="space-y-3">
              <p className="text-destructive text-sm" role="alert">
                {getApiErrorMessage(profileQ.error) || t("profileLoadError")}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => void profileQ.refetch()}
              >
                {t("profileRetry")}
              </Button>
            </div>
          ) : null}

          {profile ? (
            <>
              <dl className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
                <div>
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {t("field.userId")}
                  </dt>
                  <dd className="text-foreground mt-1 break-all font-mono text-sm">
                    {profile.userId}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {t("field.createdAt")}
                  </dt>
                  <dd className="text-foreground mt-1 text-sm font-medium">
                    {formatTimestamp(profile.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {t("field.updatedAt")}
                  </dt>
                  <dd className="text-foreground mt-1 text-sm font-medium">
                    {formatTimestamp(profile.updatedAt)}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-start lg:max-w-2xl">
                <div className="relative mx-auto shrink-0 sm:mx-0">
                  <div className="border-border bg-muted/40 flex size-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed">
                    {avatarPreviewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarPreviewUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <UserRound
                        className="text-muted-foreground size-10"
                        aria-hidden
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    className="border-background bg-primary text-primary-foreground absolute -right-1 bottom-0 flex size-8 items-center justify-center rounded-full border-2 shadow-md"
                    onClick={focusAvatarField}
                    aria-label={t("avatarUploadCta")}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                  </button>
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <Label
                    htmlFor="admin-avatar-url"
                    className="text-sm font-medium"
                  >
                    {t("field.avatarPath")}
                  </Label>
                  <Input
                    id="admin-avatar-url"
                    value={avatarPath}
                    onChange={(e) => {
                      setAvatarPath(e.target.value);
                      dismissSaveSuccess();
                    }}
                    placeholder="https://example.com/avatar.png"
                    className={cn(controlRound, "max-w-lg")}
                  />
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {t("avatarHint")}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 lg:max-w-2xl">
                <div className="space-y-2">
                  <Label htmlFor="admin-dept" className="text-sm font-medium">
                    {t("field.department")}
                  </Label>
                  <Input
                    id="admin-dept"
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value);
                      dismissSaveSuccess();
                    }}
                    className={controlRound}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-title" className="text-sm font-medium">
                    {t("field.jobTitle")}
                  </Label>
                  <Input
                    id="admin-title"
                    value={jobTitle}
                    onChange={(e) => {
                      setJobTitle(e.target.value);
                      dismissSaveSuccess();
                    }}
                    className={controlRound}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-lang" className="text-sm font-medium">
                    {t("field.preferredLang")}
                  </Label>
                  <select
                    id="admin-lang"
                    value={preferredLang}
                    onChange={(e) => {
                      setPreferredLang(e.target.value);
                      dismissSaveSuccess();
                    }}
                    className={cn(
                      controlRound,
                      "border-input bg-background w-full max-w-xs px-3 text-sm outline-none",
                      "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]",
                    )}
                  >
                    <option value="en">{t("langEnglish")}</option>
                    <option value="am">{t("langAmharic")}</option>
                  </select>
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
                  {t("discardChanges")}
                </button>
                <Button
                  type="button"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="h-11 gap-2 rounded-lg px-6 font-semibold shadow-sm"
                >
                  {saveMutation.isPending ? t("saving") : t("saveProfile")}
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/profile/admin/change-password"
          className={cn(
            panelSurface,
            "hover:border-primary/30 flex items-start gap-3 p-5 transition-colors",
          )}
        >
          <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
            <Lock className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-semibold">{t("linkPasswordTitle")}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("linkPasswordBody")}
            </p>
          </div>
        </Link>
        <Link
          href="/profile/admin/two-factor"
          className={cn(
            panelSurface,
            "hover:border-primary/30 flex items-start gap-3 p-5 transition-colors",
          )}
        >
          <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
            <Shield className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-semibold">{t("linkMfaTitle")}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("linkMfaBody")}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
