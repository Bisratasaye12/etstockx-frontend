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
import { Link, usePathname } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";

const BASE = "/profile/admin";

type NavKey =
  | "navProfile"
  | "navChangePassword"
  | "navTwoFactor"
  | "navSessions"
  | "navNotifications"
  | "navNotificationHistory";

const NAV: { href: string; key: NavKey; icon: typeof UserRound }[] = [
  { href: BASE, key: "navProfile", icon: UserRound },
  { href: `${BASE}/sessions`, key: "navSessions", icon: MonitorSmartphone },
  { href: `${BASE}/change-password`, key: "navChangePassword", icon: Lock },
  { href: `${BASE}/two-factor`, key: "navTwoFactor", icon: Shield },
  { href: `${BASE}/notifications`, key: "navNotifications", icon: Bell },
  {
    href: `${BASE}/notifications/history`,
    key: "navNotificationHistory",
    icon: FileText,
  },
];

function isAdminProfileHome(pathname: string) {
  const p = pathname.split("?")[0].replace(/\/$/, "") || pathname;
  return p === BASE || p.endsWith(BASE);
}

function isNavActive(pathname: string, href: string) {
  if (href === BASE) {
    return isAdminProfileHome(pathname);
  }
  // Don't highlight the preferences tab when user is on the history screen.
  if (href === `${BASE}/notifications`) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminProfileChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const t = useTranslations("admin.profile");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isHome = isAdminProfileHome(pathname);

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
                const active = isNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
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

        <div className="min-w-0 space-y-6">{children}</div>
      </div>
    </div>
  );
}
