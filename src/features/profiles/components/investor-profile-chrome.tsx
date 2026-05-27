"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  FileText,
  Lock,
  MonitorSmartphone,
  Shield,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";
import { InvestorProfileSettingsSkeleton } from "@/features/investor/components/investor-skeletons";
import { usePortalNavigation } from "@/shared/hooks/use-portal-navigation";

type NavKey =
  | "navProfile"
  | "navChangePassword"
  | "navTwoFactor"
  | "navSessions"
  | "navNotifications"
  | "navNotificationHistory";

const NAV: { href: string; key: NavKey; icon: typeof UserRound }[] = [
  { href: "/profile/client", key: "navProfile", icon: UserRound },
  {
    href: "/profile/client/sessions",
    key: "navSessions",
    icon: MonitorSmartphone,
  },
  {
    href: "/profile/client/change-password",
    key: "navChangePassword",
    icon: Lock,
  },
  { href: "/profile/client/two-factor", key: "navTwoFactor", icon: Shield },
  {
    href: "/profile/client/notifications",
    key: "navNotifications",
    icon: Bell,
  },
  {
    href: "/profile/client/notifications/history",
    key: "navNotificationHistory",
    icon: FileText,
  },
];

function isInvestorProfileHome(pathname: string) {
  const p = pathname.split("?")[0].replace(/\/$/, "") || pathname;
  return p === "/profile/client" || p.endsWith("/profile/client");
}

function isNavActive(pathname: string, href: string) {
  if (href === "/profile/client") {
    return isInvestorProfileHome(pathname);
  }
  // Don't highlight the preferences tab when user is on the history screen.
  if (href === "/profile/client/notifications") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function InvestorProfileChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("investor.profileSettings");
  const [mounted, setMounted] = useState(false);

  const { isNavigating, beginNavigation, isItemActive, pathname } =
    usePortalNavigation(isNavActive);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isHome = isInvestorProfileHome(pathname);

  return (
    <div className="mx-auto max-w-[1180px] space-y-8">
      <header className="space-y-1">
        <h1 className="text-foreground text-[1.75rem] font-bold tracking-tight md:text-[2rem]">
          {t("figmaTitle")}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          {isHome ? t("figmaSubtitle") : t("settingsAreaSubtitle")}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        <nav
          className="border-border bg-card space-y-0.5 rounded-xl border p-2 shadow-sm"
          aria-label={t("navAria")}
        >
          {mounted
            ? NAV.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    onClick={() => beginNavigation(item.href)}
                    className={cn(
                      "text-muted-foreground hover:bg-muted/80 hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active && "bg-primary/10 text-primary font-semibold",
                    )}
                  >
                    <Icon
                      className="size-[18px] shrink-0 opacity-90"
                      aria-hidden
                    />
                    {t(item.key)}
                  </Link>
                );
              })
            : null}
        </nav>

        <div className="min-w-0 space-y-6">
          {isNavigating ? (
            <InvestorProfileSettingsSkeleton />
          ) : (
            <div key={pathname}>{children}</div>
          )}
        </div>
      </div>
    </div>
  );
}
