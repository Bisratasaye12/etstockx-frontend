"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Bookmark,
  ChevronRight,
  ClipboardList,
  Contact,
  List,
  Lock,
  UserRound,
  Clock,
  ArrowLeftRight,
  Tag,
  CircleCheck,
  MoreHorizontal,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";
import { useClientProfile } from "@/features/profiles/api/use-client-profile";
import { useWatchlist } from "@/features/profiles/api/use-watchlist";
import { useInvestorDashboardData } from "@/features/investor/api/use-investor-dashboard-data";
import {
  listingSummariesById,
  useMarketListingSummaries,
} from "@/features/market/api/use-market-listing-summaries";
import { buttonVariants } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  formatListingPrice,
  formatSectorLabel,
  requestTypeBadgeClassName,
  tradeStatusBadgeClassName,
} from "@/features/investor/lib/request-status-presentational";

function greetingPeriod(date: Date): "morning" | "afternoon" | "evening" {
  const h = date.getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function investorDisplayName(
  email: string | null | undefined,
  profile:
    | {
        accountNickname: string | null;
        contactPerson: string | null;
      }
    | undefined,
): string {
  const nick = profile?.accountNickname?.trim();
  if (nick) return nick.split(/\s+/)[0] ?? nick;
  const contact = profile?.contactPerson?.trim();
  if (contact) return contact.split(/\s+/)[0] ?? contact;
  const local = email?.split("@")[0] ?? "there";
  const token = local.split(/[._-]/)[0];
  if (!token) return "there";
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

function CheckRow({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-start gap-3 text-left">
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
          done
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/30",
        )}
        aria-hidden
      >
        {done ? (
          <span className="text-xs leading-none font-bold">✓</span>
        ) : null}
      </span>
      <span
        className={cn(
          "text-sm leading-relaxed",
          done ? "text-muted-foreground line-through" : "text-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}

export function InvestorOverview() {
  const { data: session, status } = useSession();
  const t = useTranslations("investor.dashboard");
  const tStatus = useTranslations("investor.dashboard.requestStatus");
  const tType = useTranslations("investor.dashboard.requestType");
  const { data: profile, isLoading: profileLoading } = useClientProfile();
  const isActivated = Boolean(session?.user?.isActivated);

  const { data: watchlist } = useWatchlist({ enabled: isActivated });
  const { data: listingSummaries, isLoading: listingsLoading } =
    useMarketListingSummaries({ enabled: isActivated });

  const {
    activeRequestsTotal,
    inNegotiationTotal,
    termsAgreedTotal,
    completedTotal,
    recentRequests,
    statsLoading,
    recentLoading,
  } = useInvestorDashboardData(isActivated);

  const period = useMemo(() => greetingPeriod(new Date()), []);

  const displayName = investorDisplayName(session?.user?.email, profile);

  const checklist = useMemo(
    () => ({
      address: Boolean(profile?.address?.trim()),
      bank: Boolean(profile?.settlementBank?.trim()),
      risk: Boolean(profile?.riskProfile?.trim()),
    }),
    [profile?.address, profile?.settlementBank, profile?.riskProfile],
  );

  const listingById = useMemo(
    () => listingSummariesById(listingSummaries),
    [listingSummaries],
  );

  const statCards = [
    {
      key: "activeRequests" as const,
      value: statsLoading ? "—" : activeRequestsTotal,
      icon: Clock,
    },
    {
      key: "inNegotiation" as const,
      value: statsLoading ? "—" : inNegotiationTotal,
      icon: ArrowLeftRight,
    },
    {
      key: "termsAgreed" as const,
      value: statsLoading ? "—" : termsAgreedTotal,
      icon: Tag,
    },
    {
      key: "completed" as const,
      value: statsLoading ? "—" : completedTotal,
      icon: CircleCheck,
    },
  ] as const;

  function requestStatusLabel(status: string | null): string {
    if (!status) return "—";
    if (tStatus.has(status)) return tStatus(status);
    return status;
  }

  if (status === "loading" || profileLoading || !session) {
    return (
      <p className="text-muted-foreground text-sm">{t("loadingOverview")}</p>
    );
  }

  if (!isActivated) {
    return (
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="space-y-1 text-center md:text-left">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t(`greeting.${period}`, { name: displayName })}
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            {t("onboardingLead")}
          </p>
        </header>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-col items-center space-y-4 pb-2 text-center">
            <div className="bg-primary/10 text-primary relative flex size-14 items-center justify-center rounded-full">
              <UserRound className="size-7" aria-hidden />
              <span className="bg-background absolute -right-0.5 -bottom-0.5 flex size-6 items-center justify-center rounded-full border shadow-sm">
                <Lock className="text-muted-foreground size-3.5" aria-hidden />
              </span>
            </div>
            <CardTitle className="text-xl">{t("onboardingTitle")}</CardTitle>
            <CardDescription className="max-w-lg text-base leading-relaxed">
              {t("onboardingBody")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-8 pb-10">
            <div className="w-full max-w-sm space-y-4">
              <CheckRow done={checklist.address} label={t("checkAddress")} />
              <CheckRow done={checklist.bank} label={t("checkBank")} />
              <CheckRow done={checklist.risk} label={t("checkRisk")} />
            </div>
            <Link
              href="/profile/client"
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "h-11 rounded-full px-8 text-sm font-semibold",
              )}
            >
              {t("completeProfileCta")}
            </Link>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/market"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "border-border bg-card hover:bg-muted/40 flex h-auto w-full min-w-0 items-center gap-3 rounded-2xl px-5 py-5 text-left font-normal whitespace-normal",
            )}
          >
            <span className="flex min-w-0 flex-1 items-start gap-3">
              <span className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-xl">
                <List className="text-muted-foreground size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 space-y-1">
                <span className="text-foreground block font-semibold break-words">
                  {t("shortcutListingsTitle")}
                </span>
                <span className="text-muted-foreground block text-sm leading-snug break-words hyphens-auto">
                  {t("shortcutListingsDesc")}
                </span>
              </span>
            </span>
            <ChevronRight
              className="text-muted-foreground size-5 shrink-0 self-center"
              aria-hidden
            />
          </Link>
          <Link
            href="/brokers"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "border-border bg-card hover:bg-muted/40 flex h-auto w-full min-w-0 items-center gap-3 rounded-2xl px-5 py-5 text-left font-normal whitespace-normal",
            )}
          >
            <span className="flex min-w-0 flex-1 items-start gap-3">
              <span className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-xl">
                <Contact className="text-muted-foreground size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 space-y-1">
                <span className="text-foreground block font-semibold break-words">
                  {t("shortcutBrokersTitle")}
                </span>
                <span className="text-muted-foreground block text-sm leading-snug break-words hyphens-auto">
                  {t("shortcutBrokersDesc")}
                </span>
              </span>
            </span>
            <ChevronRight
              className="text-muted-foreground size-5 shrink-0 self-center"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t(`greeting.${period}`, { name: displayName })}
        </h1>
        <p className="text-muted-foreground text-base">
          {t("activatedSubtitle")}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ key, value, icon: Icon }) => (
          <Card key={key} className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {t(`stats.${key}`)}
              </CardTitle>
              <Icon className="text-muted-foreground size-4" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/80 lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-4">
            <CardTitle className="text-lg">
              {t("recentRequestsTitle")}
            </CardTitle>
            <Link
              href="/requests"
              className={cn(
                buttonVariants({ variant: "link" }),
                "text-muted-foreground h-auto px-0 text-sm font-medium",
              )}
            >
              {t("viewAllRequests")}
            </Link>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <p className="text-muted-foreground text-sm">
                {t("loadingSection")}
              </p>
            ) : recentRequests.length === 0 ? (
              <div className="border-muted-foreground/25 bg-muted/20 flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed px-6 py-14 text-center">
                <ClipboardList
                  className="text-muted-foreground size-10 opacity-60"
                  aria-hidden
                />
                <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
                  {t("recentRequestsEmpty")}
                </p>
                <Link
                  href="/market"
                  className={cn(
                    buttonVariants({ variant: "default", size: "default" }),
                    "rounded-full",
                  )}
                >
                  {t("browseListings")}
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-muted/40 border-b">
                    <tr>
                      <th className="text-muted-foreground px-4 py-3 font-medium">
                        {t("tableInstrument")}
                      </th>
                      <th className="text-muted-foreground px-4 py-3 font-medium">
                        {t("tableType")}
                      </th>
                      <th className="text-muted-foreground px-4 py-3 font-medium">
                        {t("tableStatus")}
                      </th>
                      <th className="text-muted-foreground px-4 py-3 font-medium">
                        {t("tableDate")}
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-right font-medium">
                        {t("tableAction")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {recentRequests.map((row) => (
                      <tr key={`${row.kind}-${row.id}`}>
                        <td className="px-4 py-3 font-medium">
                          {row.instrumentName?.trim() ||
                            row.ticker?.trim() ||
                            t("unnamedRequest")}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-medium",
                              requestTypeBadgeClassName(row.kind),
                            )}
                          >
                            {tType(row.kind)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                              tradeStatusBadgeClassName(row.status),
                            )}
                          >
                            {requestStatusLabel(row.status)}
                          </span>
                        </td>
                        <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                          {new Date(row.createdAt).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/requests/${row.kind}/${row.id}`}
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "sm" }),
                              "text-primary font-medium",
                            )}
                          >
                            {t("view")}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">{t("watchlistCardTitle")}</CardTitle>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors"
              aria-label={t("watchlistCardTitle")}
            >
              <MoreHorizontal className="size-5" aria-hidden />
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            {!watchlist?.length ? (
              <div className="border-muted-foreground/25 bg-muted/20 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-4 py-12 text-center">
                <Bookmark
                  className="text-muted-foreground size-8 opacity-60"
                  aria-hidden
                />
                <p className="text-muted-foreground text-sm">
                  {t("watchlistEmpty")}
                </p>
                <Link
                  href="/market"
                  className={cn(buttonVariants({ variant: "link" }), "text-sm")}
                >
                  {t("browseListings")}
                </Link>
              </div>
            ) : listingsLoading ? (
              <p className="text-muted-foreground text-sm">
                {t("loadingSection")}
              </p>
            ) : (
              <ul className="space-y-3">
                {watchlist.slice(0, 5).map((w) => {
                  const listing = listingById.get(w.listingId);
                  const name =
                    listing?.instrumentName?.trim() ||
                    listing?.ticker?.trim() ||
                    t("listingUnavailable");
                  const sector = formatSectorLabel(listing?.sector);
                  return (
                    <li
                      key={w.id}
                      className="border-border flex flex-col gap-1 rounded-xl border bg-card/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{name}</p>
                        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
                          {sector ? (
                            <span className="bg-muted rounded-md px-2 py-0.5 font-medium">
                              {sector}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <p className="shrink-0 pt-1 text-right font-semibold tabular-nums sm:pt-0">
                        {listing
                          ? formatListingPrice(listing.price, listing.currency)
                          : "—"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
            {watchlist?.length ? (
              <div className="border-border flex flex-col gap-2 border-t pt-4">
                {watchlist.length > 5 ? (
                  <Link
                    href="/watchlist"
                    className={cn(
                      buttonVariants({ variant: "link" }),
                      "text-muted-foreground px-0 text-sm",
                    )}
                  >
                    {t("seeAllWatchlist")}
                  </Link>
                ) : null}
                <Link
                  href="/watchlist"
                  className={cn(
                    buttonVariants({ variant: "link" }),
                    "text-foreground justify-center px-0 text-sm font-semibold",
                  )}
                >
                  {t("manageWatchlist")}
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
