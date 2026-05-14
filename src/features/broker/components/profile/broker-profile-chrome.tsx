"use client";

import { useEffect, useState } from "react";
import { Bell, Lock, MonitorSmartphone, Shield, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";

type NavKey =
  | "navProfile"
  | "navChangePassword"
  | "navTwoFactor"
  | "navSessions"
  | "navNotifications";

const NAV: { href: string; key: NavKey; icon: typeof UserRound }[] = [
  { href: "/profile/broker", key: "navProfile", icon: UserRound },
  {
    href: "/profile/broker/sessions",
    key: "navSessions",
    icon: MonitorSmartphone,
  },
  {
    href: "/profile/broker/change-password",
    key: "navChangePassword",
    icon: Lock,
  },
  { href: "/profile/broker/two-factor", key: "navTwoFactor", icon: Shield },
  {
    href: "/profile/broker/notifications",
    key: "navNotifications",
    icon: Bell,
  },
];

function isBrokerProfileHome(pathname: string) {
  const p = pathname.split("?")[0].replace(/\/$/, "") || pathname;
  return p === "/profile/broker" || p.endsWith("/profile/broker");
}

function isNavActive(pathname: string, href: string) {
  if (href === "/profile/broker") {
    return isBrokerProfileHome(pathname);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BrokerProfileChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const t = useTranslations("broker.profile");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isHome = isBrokerProfileHome(pathname);

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
