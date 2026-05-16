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
  Settings,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useAppLogout } from "@/features/auth/hooks/use-app-logout";
import { Link } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";
import { useBrokerIncomingRequests } from "@/features/broker/api/use-broker-incoming-requests";
import { useUnreadMessageTotal } from "@/features/messaging/api/use-unread-message-total";
import { NotificationBellDropdown } from "@/features/notifications/components/notification-bell-dropdown";
import { getNotificationsFullPagePath } from "@/features/notifications/lib/get-notifications-full-page-path";
import type { UserRole } from "@/shared/api/types";
import { DashboardHeaderProfileMenu } from "@/shared/ui/dashboard-header-profile-menu";
import { BrokerNavigatingSkeleton } from "@/features/broker/components/broker-skeletons";
import { usePortalNavigation } from "@/shared/hooks/use-portal-navigation";
import { useSidebarCollapsed } from "@/shared/hooks/use-sidebar-collapsed";
import {
  portalSidebarAsideClass,
  portalSidebarNavLabelClass,
} from "@/shared/lib/sidebar-layout";
import { SidebarCollapseToggle } from "@/shared/ui/sidebar-collapse-toggle";

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

  const { collapsed } = useSidebarCollapsed();

  const settingsActive = isNavigating
    ? pendingHref?.startsWith("/profile/broker")
    : pathname.startsWith("/profile/broker");

  return (
    <div className="bg-muted/20 flex min-h-screen w-full items-stretch">
      <aside className={portalSidebarAsideClass(collapsed)}>
        <div className={cn("shrink-0 pt-5 pb-3", collapsed ? "px-2" : "px-5")}>
          <Link
            href="/"
            className={cn(
              "relative block h-9 shrink-0",
              collapsed ? "mx-auto w-9" : "w-[148px]",
            )}
            title={collapsed ? tCommon("appName") : undefined}
          >
            <Image
              src="/EtStockX.svg"
              alt={tCommon("appName")}
              fill
              className={cn(
                "object-contain",
                collapsed ? "object-center" : "object-left",
              )}
              sizes={collapsed ? "36px" : "148px"}
              unoptimized
              priority
            />
          </Link>
          {!collapsed ? (
            <p className="text-muted-foreground mt-2 text-xs font-medium tracking-wide uppercase">
              {t("portalSubtitle")}
            </p>
          ) : null}
        </div>

        <div className={cn("shrink-0 pb-4", collapsed ? "px-2" : "px-4")}>
          <Link
            href="/dashboard/broker/listings/new"
            prefetch
            onClick={() => beginNavigation("/dashboard/broker/listings/new")}
            title={collapsed ? t("newListing") : undefined}
            className={cn(
              buttonVariants({ variant: "default", size: "default" }),
              "rounded-lg text-sm font-semibold shadow-sm",
              collapsed ? "mx-auto size-11 p-0" : "h-11 w-full",
            )}
          >
            {collapsed ? (
              <span className="text-lg leading-none">+</span>
            ) : (
              <>+ {t("newListing")}</>
            )}
          </Link>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 px-3">
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

            const label = t(item.labelKey);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                title={collapsed ? label : undefined}
                onClick={() => beginNavigation(item.href)}
                className={cn(
                  BROKER_PORTAL_SIDEBAR_ROW_CLASS,
                  collapsed && "justify-center gap-0 px-2",
                  active && BROKER_PORTAL_SIDEBAR_ROW_ACTIVE_CLASS,
                )}
              >
                <span className="relative shrink-0">
                  <Icon className="size-[18px]" aria-hidden />
                  {collapsed && badge != null ? (
                    <span className="absolute -top-1 -right-1 size-2 rounded-full bg-amber-500" />
                  ) : null}
                </span>
                <span className={portalSidebarNavLabelClass(collapsed)}>
                  {label}
                </span>
                {!collapsed && badge != null ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-border shrink-0 border-t px-3 py-4">
          <Link
            href="/profile/broker"
            prefetch
            title={collapsed ? t("settings") : undefined}
            onClick={() => beginNavigation("/profile/broker")}
            className={cn(
              BROKER_PORTAL_SIDEBAR_ROW_CLASS,
              collapsed && "justify-center gap-0 px-2",
              settingsActive && BROKER_PORTAL_SIDEBAR_ROW_ACTIVE_CLASS,
            )}
          >
            <Settings className="size-[18px] shrink-0" aria-hidden />
            <span className={portalSidebarNavLabelClass(collapsed)}>
              {t("settings")}
            </span>
          </Link>
          <button
            type="button"
            disabled={logoutPending}
            title={collapsed ? tNav("signOut") : undefined}
            onClick={() => void logout(`/${locale}/login`)}
            className={cn(
              BROKER_PORTAL_SIDEBAR_ROW_CLASS,
              collapsed && "justify-center gap-0 px-2",
              "cursor-pointer",
            )}
          >
            <LogOut className="size-[18px] shrink-0" aria-hidden />
            <span
              className={cn(
                portalSidebarNavLabelClass(collapsed),
                !collapsed && "flex-1 text-left",
              )}
            >
              {tNav("signOut")}
            </span>
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur-md">
          <div className="flex h-[60px] items-center gap-4 px-5 lg:px-8">
            <SidebarCollapseToggle />
            <div className="min-w-0 flex-1" />
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
