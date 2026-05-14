"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { Lock, Shield } from "lucide-react";
import { useAdminMe } from "@/features/admin/api/use-admin-me";
import type { AdminMeDto } from "@/shared/api/dtos/admin-me";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

const panelSurface =
  "rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06)]";

const ME_FIELD_ORDER: (keyof AdminMeDto)[] = [
  "userId",
  "email",
  "fullName",
  "phone",
  "preferredLang",
  "department",
  "jobTitle",
  "createdAt",
  "lastSignInAt",
];

function formatMeValue(key: keyof AdminMeDto, raw: string): string {
  if (key === "createdAt" || key === "lastSignInAt") {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? raw : d.toLocaleString();
  }
  return raw;
}

function meRows(dto: AdminMeDto): { field: keyof AdminMeDto; value: string }[] {
  const out: { field: keyof AdminMeDto; value: string }[] = [];
  for (const key of ME_FIELD_ORDER) {
    const v = dto[key];
    if (v == null) continue;
    const s = typeof v === "string" ? v.trim() : String(v);
    if (!s) continue;
    out.push({ field: key, value: formatMeValue(key, s) });
  }
  return out;
}

export function AdminAccountShell() {
  const { data: session, status } = useSession();
  const meQ = useAdminMe();
  const t = useTranslations("admin.profile.account");
  const tMeField = useTranslations("admin.profile.account.meField");
  const th = useTranslations("headerProfile");

  const email = session?.user?.email ?? "";
  const name = session?.user?.name?.trim() ?? "";
  const role = session?.user?.role ?? "";

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

  const meRowsList = meQ.data ? meRows(meQ.data) : [];

  return (
    <div className="space-y-6">
      <div className={panelSurface}>
        <div className="border-border flex flex-col gap-6 border-b px-6 py-6 md:flex-row md:items-center md:px-8 md:py-8">
          <span className="bg-primary text-primary-foreground flex size-16 shrink-0 items-center justify-center rounded-2xl text-lg font-bold shadow-inner">
            {status === "loading" ? "…" : initials}
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

      <section className={panelSurface} aria-labelledby="admin-me-heading">
        <div className="border-border border-b px-6 py-5 md:px-8 md:py-6">
          <h2
            id="admin-me-heading"
            className="text-lg font-semibold tracking-tight"
          >
            {t("meSectionTitle")}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            {t("meSectionHint")}
          </p>
        </div>
        <div className="px-6 py-5 md:px-8 md:py-6">
          {meQ.isPending ? (
            <p className="text-muted-foreground text-sm">{t("meLoading")}</p>
          ) : null}
          {meQ.isError ? (
            <div className="space-y-3">
              <p className="text-destructive text-sm" role="alert">
                {getApiErrorMessage(meQ.error) || t("meLoadError")}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => void meQ.refetch()}
              >
                {t("meRetry")}
              </Button>
            </div>
          ) : null}
          {!meQ.isPending && !meQ.isError && meRowsList.length === 0 ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("meEmpty")}
            </p>
          ) : null}
          {!meQ.isPending && !meQ.isError && meRowsList.length > 0 ? (
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {meRowsList.map(({ field, value }) => (
                <div key={field} className="min-w-0">
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {tMeField(field)}
                  </dt>
                  <dd className="text-foreground mt-1 break-words text-sm font-medium">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
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
