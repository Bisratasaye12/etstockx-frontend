"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Award,
  Ban,
  CheckCircle2,
  ChevronRight,
  Globe,
  GraduationCap,
  Handshake,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Target,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { useBrokerDirectory } from "@/features/profiles/api/use-broker-directory";
import {
  institutionInitials,
  personInitials,
} from "@/features/brokers/lib/filter-brokers";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";

type Props = { brokerId: string };

export function BrokerProfileView({ brokerId }: Props) {
  const t = useTranslations("investor.brokers");
  const { status, data: session } = useSession();
  const { data, isLoading, error } = useBrokerDirectory();

  const broker = useMemo(
    () => (data ?? []).find((b) => b.userId === brokerId),
    [data, brokerId],
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center gap-2">
        <Loader2 className="size-6 animate-spin" aria-hidden />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="border-border/80 bg-card mx-auto max-w-lg space-y-4 rounded-2xl border p-8 text-center">
        <p className="text-muted-foreground text-sm">{t("signInBody")}</p>
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "default" }),
            "inline-flex h-10 items-center justify-center rounded-full px-8 font-semibold",
          )}
        >
          {t("signInCta")}
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-border/80 bg-card mx-auto max-w-lg space-y-4 rounded-2xl border p-8 text-center">
        <p className="text-destructive text-sm">
          {getApiErrorMessage(error) || t("loadError")}
        </p>
        <Link
          href="/brokers"
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}
        >
          {t("backToDirectory")}
        </Link>
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="border-border/80 bg-card mx-auto max-w-lg space-y-4 rounded-2xl border p-8 text-center">
        <p className="text-muted-foreground text-sm">{t("notFound")}</p>
        <Link
          href="/brokers"
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}
        >
          {t("backToDirectory")}
        </Link>
      </div>
    );
  }

  const fullName = broker.fullName?.trim();
  const institution = broker.institution?.trim();
  const headline = fullName || institution || t("unnamedBroker");
  const subline = fullName
    ? (institution ?? "")
    : (broker.licenseDisplay?.trim() ?? "");
  const initials = fullName
    ? personInitials(fullName)
    : institutionInitials(broker.institution);
  const specs = broker.specializations ?? [];
  const aboutChips = specs.slice(0, Math.min(3, specs.length));
  const detailSpecs = specs.length > 3 ? specs.slice(3) : specs;

  const firstName =
    (fullName ?? headline).split(/\s+/).filter(Boolean)[0] ?? headline;

  const role = session?.user?.role ?? "";
  const isClient = role === "Client";
  const isActivated = Boolean(session?.user?.isActivated);

  const publicEmail = broker.publicEmail?.trim();
  const publicOffice = broker.publicOfficeLocation?.trim();
  const publicLanguages = broker.publicLanguages?.trim();

  return (
    <div className="space-y-8 pb-12">
      <nav
        className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm"
        aria-label={t("breadcrumbAria")}
      >
        <Link href="/brokers" className="hover:text-foreground font-medium">
          {t("title")}
        </Link>
        <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden />
        <span className="text-foreground font-medium">{headline}</span>
      </nav>

      <Link
        href="/brokers"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToDirectory")}
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="bg-primary/12 text-primary flex size-20 shrink-0 items-center justify-center rounded-full text-xl font-bold">
            {initials}
          </div>
          <div className="space-y-1">
            <h1 className="text-foreground text-3xl font-bold tracking-tight">
              {headline}
            </h1>
            {subline ? (
              <p className="text-muted-foreground text-sm">{subline}</p>
            ) : null}
          </div>
        </div>
        <span
          className={cn(
            "inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
            broker.isAcceptingRequests
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
              : "border-border bg-muted text-muted-foreground",
          )}
        >
          {broker.isAcceptingRequests ? (
            <>
              <CheckCircle2 className="size-3.5" aria-hidden />
              {t("acceptingBadge")}
            </>
          ) : (
            <>
              <Ban className="size-3.5" aria-hidden />
              {t("notAcceptingBadge")}
            </>
          )}
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-6">
          <section className="border-border/80 bg-card rounded-2xl border p-6 shadow-sm">
            <h2 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
              <User className="text-primary size-5" aria-hidden />
              {t("aboutTitle")}
            </h2>
            {broker.bio?.trim() ? (
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {broker.bio.trim()}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm italic">
                {t("noBioLong")}
              </p>
            )}
            {aboutChips.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {aboutChips.map((tag) => (
                  <span
                    key={tag}
                    className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          <div className="grid gap-6 sm:grid-cols-2">
            <section className="border-border/80 bg-card rounded-2xl border p-6 shadow-sm">
              <h2 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
                <Target className="text-primary size-5" aria-hidden />
                {t("specializationsTitle")}
              </h2>
              {detailSpecs.length > 0 ? (
                <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
                  {detailSpecs.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  {t("noSpecializations")}
                </p>
              )}
            </section>

            <section className="border-border/80 bg-card rounded-2xl border p-6 shadow-sm">
              <h2 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
                <Award className="text-primary size-5" aria-hidden />
                {t("credentialsTitle")}
              </h2>
              <ul className="space-y-4">
                {broker.licenseDisplay?.trim() ? (
                  <li className="flex gap-3 text-sm">
                    <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                    <div>
                      <p className="text-foreground font-medium">
                        {t("licenseCredential")}
                      </p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {broker.licenseDisplay.trim()}
                      </p>
                    </div>
                  </li>
                ) : (
                  <li className="text-muted-foreground text-sm italic">
                    {t("noCredentials")}
                  </li>
                )}
                {broker.licenseDisplay?.trim() ? (
                  <li className="flex gap-3 text-sm">
                    <GraduationCap className="text-primary mt-0.5 size-4 shrink-0" />
                    <div>
                      <p className="text-foreground font-medium">
                        {t("credentialSecondaryTitle")}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {t("credentialSecondaryIssuer")}
                      </p>
                    </div>
                  </li>
                ) : null}
              </ul>
            </section>
          </div>
        </div>

        <div className="space-y-6">
          <section className="border-border/80 bg-card rounded-2xl border p-6 shadow-sm">
            {!broker.isAcceptingRequests ? (
              <>
                <div className="text-muted-foreground mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
                  <Ban className="size-5" aria-hidden />
                </div>
                <h2 className="text-foreground text-lg font-semibold">
                  {t("unavailableTitle")}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {t("unavailableBody")}
                </p>
                <div
                  className="border-border bg-muted/50 text-muted-foreground mt-4 flex h-10 w-full items-center justify-center rounded-lg border text-sm font-medium"
                  aria-disabled
                >
                  {t("notAcceptingCta")}
                </div>
                <Link
                  href="/brokers"
                  className="text-primary mt-4 block text-center text-sm font-semibold hover:underline"
                >
                  {t("browseOtherBrokers")}
                </Link>
              </>
            ) : !isClient ? (
              <>
                <div className="text-muted-foreground mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
                  <User className="size-5" aria-hidden />
                </div>
                <h2 className="text-foreground text-lg font-semibold">
                  {t("nonInvestorRequestTitle")}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {t("nonInvestorRequestBody")}
                </p>
                <Link
                  href="/market"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "mt-4 flex h-11 w-full items-center justify-center rounded-lg font-semibold",
                  )}
                >
                  {t("nonInvestorRequestCta")}
                </Link>
              </>
            ) : !isActivated ? (
              <>
                <div className="text-muted-foreground mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
                  <Lock className="size-5" aria-hidden />
                </div>
                <h2 className="text-foreground text-lg font-semibold">
                  {t("activateCardTitle")}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {t("activateCardBody", { name: firstName })}
                </p>
                <Link
                  href="/profile/client"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "mt-4 flex h-11 w-full items-center justify-center rounded-lg font-semibold",
                  )}
                >
                  {t("completeProfileCta")}
                </Link>
              </>
            ) : (
              <>
                <div className="text-primary mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <Handshake className="size-5" aria-hidden />
                </div>
                <h2 className="text-foreground text-lg font-semibold">
                  {t("requestCtaTitle")}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {t("requestCtaBody", { name: firstName })}
                </p>
                <Link
                  href="/market"
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "mt-4 flex h-11 w-full items-center justify-center rounded-lg font-semibold",
                  )}
                >
                  {t("submitRequestCta")}
                </Link>
                <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
                  {t("requestCtaFootnote")}
                </p>
              </>
            )}
          </section>

          <section className="border-border/80 bg-card rounded-2xl border p-6 shadow-sm">
            <h2 className="text-foreground mb-4 text-lg font-semibold">
              {t("contactTitle")}
            </h2>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3">
                <Mail
                  className="text-muted-foreground mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
                <div>
                  <p className="text-foreground text-xs font-semibold tracking-wide uppercase">
                    {t("contactEmailLabel")}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    {publicEmail ?? t("contactEmailPlaceholder")}
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <MapPin
                  className="text-muted-foreground mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
                <div>
                  <p className="text-foreground text-xs font-semibold tracking-wide uppercase">
                    {t("contactOfficeLabel")}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    {publicOffice ?? t("contactLocationPlaceholder")}
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Globe
                  className="text-muted-foreground mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
                <div>
                  <p className="text-foreground text-xs font-semibold tracking-wide uppercase">
                    {t("contactLanguagesLabel")}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    {publicLanguages ?? t("contactLanguagesPlaceholder")}
                  </p>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
