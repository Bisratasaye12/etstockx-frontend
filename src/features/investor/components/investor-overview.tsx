"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Bookmark,
  ChevronRight,
  ClipboardList,
  Eye,
  Handshake,
  Contact,
  List,
  Lock,
  MessageSquare,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";
import { useClientProfile } from "@/features/profiles/api/use-client-profile";
import { useWatchlist } from "@/features/profiles/api/use-watchlist";
import { useInvestorDashboardData } from "@/features/investor/api/use-investor-dashboard-data";
import { buttonVariants } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

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
  const { data: profile, isLoading: profileLoading } = useClientProfile();
  const isActivated = Boolean(session?.user?.isActivated);

  const { data: watchlist } = useWatchlist({ enabled: isActivated });
  const {
    activeRequestsTotal,
    unreadMessages,
    pendingDeals,
    recentBuyRequests,
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

  const savedListingsCount = watchlist?.length ?? 0;

  const statCards = [
    {
      key: "activeRequests",
      value: statsLoading ? "—" : activeRequestsTotal,
      icon: ClipboardList,
    },
    {
      key: "savedListings",
      value: statsLoading ? "—" : savedListingsCount,
      icon: Eye,
    },
    {
      key: "pendingDeals",
      value: statsLoading ? "—" : pendingDeals,
      icon: Handshake,
    },
    {
      key: "unreadMessages",
      value: statsLoading ? "—" : unreadMessages,
      icon: MessageSquare,
    },
  ] as const;

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
          <CardHeader className="flex flex-row items-center justify-between space-y-1 pb-4">
            <CardTitle className="text-lg">
              {t("recentRequestsTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <p className="text-muted-foreground text-sm">
                {t("loadingSection")}
              </p>
            ) : recentBuyRequests.length === 0 ? (
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
              <ul className="divide-border divide-y rounded-xl border">
                {recentBuyRequests.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {row.instrumentName ??
                          row.ticker ??
                          t("unnamedRequest")}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {row.status ?? "—"} ·{" "}
                        {new Date(row.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <Link
                      href="/requests"
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "shrink-0",
                      )}
                    >
                      {t("view")}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{t("watchlistCardTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
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
            ) : (
              <ul className="space-y-2">
                {watchlist.slice(0, 5).map((w) => (
                  <li
                    key={w.id}
                    className="text-muted-foreground flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate">{w.listingId}</span>
                  </li>
                ))}
                {watchlist.length > 5 ? (
                  <Link
                    href="/watchlist"
                    className={cn(
                      buttonVariants({ variant: "link" }),
                      "px-0 text-sm",
                    )}
                  >
                    {t("seeAllWatchlist")}
                  </Link>
                ) : null}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
