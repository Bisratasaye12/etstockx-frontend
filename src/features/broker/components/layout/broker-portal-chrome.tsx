"use client";

import type { ComponentType, ReactNode } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  ClipboardList,
  LayoutDashboard,
  List,
  LogOut,
  Mail,
  MessageSquare,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useAppLogout } from "@/features/auth/hooks/use-app-logout";
import { Link } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useBrokerIncomingRequests } from "@/features/broker/api/use-broker-incoming-requests";
import { useUnreadMessageTotal } from "@/features/messaging/api/use-unread-message-total";
import { NotificationBellDropdown } from "@/features/notifications/components/notification-bell-dropdown";
import { getNotificationsFullPagePath } from "@/features/notifications/lib/get-notifications-full-page-path";
import type { UserRole } from "@/shared/api/types";
import { DashboardHeaderProfileMenu } from "@/shared/ui/dashboard-header-profile-menu";
import { BrokerNavigatingSkeleton } from "@/features/broker/components/broker-skeletons";
import { usePortalNavigation } from "@/shared/hooks/use-portal-navigation";

export type BrokerPortalNavItem = {
  href: string;
  labelKey:
    | "navDashboard"
    | "navIncoming"
    | "navListings"
    | "navClients"
    | "navMessages";
  icon: ComponentType<{ className?: string }>;
  /** Badge from incoming trade request queue total (hidden while on that route). */
  badgeFromTotal?: boolean;
  /** Badge from unread message aggregate (hidden while on messages route). */
  badgeFromUnreadMessages?: boolean;
};

export const BROKER_PORTAL_NAV: BrokerPortalNavItem[] = [
  {
    href: "/dashboard/broker",
    labelKey: "navDashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/broker/requests",
    labelKey: "navIncoming",
    icon: ClipboardList,
    badgeFromTotal: true,
  },
  { href: "/dashboard/broker/listings", labelKey: "navListings", icon: List },
  { href: "/dashboard/broker/clients", labelKey: "navClients", icon: Users },
  {
    href: "/dashboard/broker/messages",
    labelKey: "navMessages",
    icon: MessageSquare,
    badgeFromUnreadMessages: true,
  },
];

export function isBrokerPortalNavActive(pathname: string, href: string) {
  if (href === "/dashboard/broker") {
    return (
      pathname === "/dashboard/broker" || pathname === "/dashboard/broker/"
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const BROKER_PORTAL_SIDEBAR_ROW_CLASS =
  "text-muted-foreground hover:bg-muted/80 hover:text-foreground flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors";

export const BROKER_PORTAL_SIDEBAR_ROW_ACTIVE_CLASS =
  "bg-primary/12 text-primary font-semibold";

type Props = { children: ReactNode };

/** Primary broker / dealer app chrome (sidebar + header + main). Rendered from `AuthenticatedShell`. */
export function BrokerPortalChrome({ children }: Props) {
  const locale = useLocale();
  const t = useTranslations("broker.shell");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const { data: session, status } = useSession();
  const { logout, pending: logoutPending } = useAppLogout();
  const sessionRole = session?.user?.role as UserRole | undefined;

  const incomingTotal = useBrokerIncomingRequests(1, 1);
  const queueTotal = incomingTotal.data?.total ?? 0;
  const unreadMessages = useUnreadMessageTotal(
    status === "authenticated" &&
      (sessionRole === "Broker" || sessionRole === "Dealer"),
  );
  const unreadTotal = unreadMessages.data ?? 0;

  const { isNavigating, pendingHref, beginNavigation, isItemActive, pathname } =
    usePortalNavigation(isBrokerPortalNavActive);

  const settingsActive = isNavigating
    ? pendingHref?.startsWith("/profile/broker")
    : pathname.startsWith("/profile/broker");

  return (
    <div className="bg-muted/20 flex min-h-screen w-full">
      <aside className="border-border bg-card flex w-[240px] shrink-0 flex-col border-r lg:w-[260px]">
        <div className="px-5 pt-5 pb-3">
          <Link href="/" className="relative block h-9 w-[148px] shrink-0">
            <Image
              src="/EtStockX.svg"
              alt={tCommon("appName")}
              fill
              className="object-contain object-left"
              sizes="148px"
              unoptimized
              priority
            />
          </Link>
          <p className="text-muted-foreground mt-2 text-xs font-medium tracking-wide uppercase">
            {t("portalSubtitle")}
          </p>
        </div>

        <div className="px-4 pb-4">
          <Link
            href="/dashboard/broker/listings/new"
            prefetch
            onClick={() => beginNavigation("/dashboard/broker/listings/new")}
            className={cn(
              buttonVariants({ variant: "default", size: "default" }),
              "h-11 w-full rounded-lg text-sm font-semibold shadow-sm",
            )}
          >
            + {t("newListing")}
          </Link>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 px-3 pb-4">
          {BROKER_PORTAL_NAV.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);
            const showIncomingBadge =
              Boolean(item.badgeFromTotal) &&
              queueTotal > 0 &&
              !isItemActive("/dashboard/broker/requests");
            const showMessagesBadge =
              Boolean(item.badgeFromUnreadMessages) &&
              unreadTotal > 0 &&
              !isItemActive("/dashboard/broker/messages");
            const badge = showIncomingBadge
              ? Math.min(queueTotal, 99)
              : showMessagesBadge
                ? Math.min(unreadTotal, 99)
                : null;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onClick={() => beginNavigation(item.href)}
                className={cn(
                  BROKER_PORTAL_SIDEBAR_ROW_CLASS,
                  active && BROKER_PORTAL_SIDEBAR_ROW_ACTIVE_CLASS,
                )}
              >
                <Icon className="size-[18px] shrink-0" aria-hidden />
                <span className="flex-1">{t(item.labelKey)}</span>
                {badge != null ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}

          <div className="mt-auto flex flex-col gap-0.5 pt-2">
            <Link
              href="/profile/broker"
              prefetch
              onClick={() => beginNavigation("/profile/broker")}
              className={cn(
                BROKER_PORTAL_SIDEBAR_ROW_CLASS,
                settingsActive && BROKER_PORTAL_SIDEBAR_ROW_ACTIVE_CLASS,
              )}
            >
              <Settings className="size-[18px] shrink-0" aria-hidden />
              <span className="flex-1">{t("settings")}</span>
            </Link>
            <button
              type="button"
              disabled={logoutPending}
              onClick={() => void logout(`/${locale}/login`)}
              className={cn(BROKER_PORTAL_SIDEBAR_ROW_CLASS, "cursor-pointer")}
            >
              <LogOut className="size-[18px] shrink-0" aria-hidden />
              <span className="flex-1 text-left">{tNav("signOut")}</span>
            </button>
          </div>
        </nav>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur-md">
          <div className="flex h-[60px] items-center gap-4 px-5 lg:px-8">
            <div className="flex min-w-0 flex-1 justify-center">
              <div className="relative w-full max-w-2xl">
                <Search
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  aria-hidden
                />
                <Input
                  placeholder={t("searchPlaceholder")}
                  className="border-border bg-background h-10 rounded-full pl-10 shadow-sm"
                  aria-label={t("searchPlaceholder")}
                />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <NotificationBellDropdown
                viewAllHref={getNotificationsFullPagePath(sessionRole)}
                enabled={status === "authenticated"}
              />
              <Link
                href="/dashboard/broker/messages"
                prefetch
                onClick={() => beginNavigation("/dashboard/broker/messages")}
                className="text-muted-foreground hover:text-foreground rounded-full p-2.5"
                aria-label={t("messages")}
              >
                <Mail className="size-5" />
              </Link>
              <DashboardHeaderProfileMenu profileHref="/profile/broker" />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] flex-1 px-5 py-8 lg:px-10">
          {isNavigating && pendingHref ? (
            <BrokerNavigatingSkeleton href={pendingHref} />
          ) : (
            <div key={pathname}>{children}</div>
          )}
        </main>
      </div>
    </div>
  );
}
