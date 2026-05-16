"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { LogOut, Mail, Plus, Settings } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useAppLogout } from "@/features/auth/hooks/use-app-logout";
import { Link } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";
import { InvestorHeaderProfileMenu } from "@/features/investor/components/investor-header-profile-menu";
import { InvestorSidebarNav } from "@/features/investor/components/investor-sidebar-nav";
import { InvestorNavigatingSkeleton } from "@/features/investor/components/investor-skeletons";
import {
  INVESTOR_PORTAL_NAV,
  isInvestorPortalNavActive,
} from "@/features/investor/config";
import { NotificationBellDropdown } from "@/features/notifications/components/notification-bell-dropdown";
import { getNotificationsFullPagePath } from "@/features/notifications/lib/get-notifications-full-page-path";
import type { UserRole } from "@/shared/api/types";
import { usePortalNavigation } from "@/shared/hooks/use-portal-navigation";
import { useSidebarCollapsed } from "@/shared/hooks/use-sidebar-collapsed";
import {
  portalSidebarAsideClass,
  portalSidebarNavLabelClass,
  portalSidebarNavRowClass,
} from "@/shared/lib/sidebar-layout";
import { SidebarCollapseToggle } from "@/shared/ui/sidebar-collapse-toggle";

type InvestorPortalChromeProps = {
  children: ReactNode;
};

export function InvestorPortalChrome({ children }: InvestorPortalChromeProps) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const tShell = useTranslations("investor.shell");
  const tCommon = useTranslations("common");
  const { data: session, status } = useSession();
  const { logout, pending: logoutPending } = useAppLogout();
  const sessionRole = session?.user?.role as UserRole | undefined;

  const { isNavigating, pendingHref, beginNavigation, isItemActive, pathname } =
    usePortalNavigation(isInvestorPortalNavActive);

  const { collapsed } = useSidebarCollapsed();

  const settingsActive = isNavigating
    ? pendingHref?.startsWith("/profile/client")
    : pathname.startsWith("/profile/client");

  return (
    <div className="bg-muted/30 flex min-h-screen w-full items-stretch">
      <aside className={portalSidebarAsideClass(collapsed, "hidden md:flex")}>
        <div className={cn("shrink-0 pt-3 pb-2", collapsed ? "px-2" : "px-6")}>
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
            <p className="text-muted-foreground mt-1 ml-1 mb-4 text-sm">
              {tShell("panelSubtitle")}
            </p>
          ) : null}
        </div>
        <div className={cn("shrink-0 pb-5", collapsed ? "px-2" : "px-4")}>
          <Link
            href="/requests/new"
            prefetch
            onClick={() => beginNavigation("/requests/new")}
            title={collapsed ? tShell("newRequest") : undefined}
            className={cn(
              buttonVariants({ variant: "default", size: "default" }),
              "rounded-full text-sm font-semibold shadow-none",
              collapsed ? "mx-auto size-11 p-0" : "h-11 w-full gap-2",
            )}
          >
            <Plus className={cn("size-4", collapsed ? "" : "")} aria-hidden />
            <span className={portalSidebarNavLabelClass(collapsed)}>
              {tShell("newRequest")}
            </span>
          </Link>
        </div>
        <InvestorSidebarNav
          items={INVESTOR_PORTAL_NAV}
          isItemActive={isItemActive}
          onNavClick={beginNavigation}
          collapsed={collapsed}
        />
        <div className="border-border shrink-0 border-t px-3 py-4">
          <Link
            href="/profile/client"
            prefetch
            title={collapsed ? t("settings") : undefined}
            onClick={() => beginNavigation("/profile/client")}
            className={portalSidebarNavRowClass(collapsed, settingsActive)}
          >
            <Settings className="size-5 shrink-0" />
            <span className={portalSidebarNavLabelClass(collapsed)}>
              {t("settings")}
            </span>
          </Link>
          <button
            type="button"
            disabled={logoutPending}
            title={collapsed ? t("signOut") : undefined}
            onClick={() => void logout(`/${locale}/login`)}
            className={cn(
              portalSidebarNavRowClass(collapsed),
              "w-full cursor-pointer",
            )}
          >
            <LogOut className="size-5 shrink-0" />
            <span className={portalSidebarNavLabelClass(collapsed)}>
              {t("signOut")}
            </span>
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur-md">
          <div className="flex h-16 items-center gap-4 px-6 md:px-8">
            <SidebarCollapseToggle className="hidden md:inline-flex" />
            <div className="min-w-0 flex-1" />
            <div className="flex shrink-0 items-center gap-1 md:gap-2">
              <NotificationBellDropdown
                viewAllHref={getNotificationsFullPagePath(sessionRole)}
                enabled={status === "authenticated"}
              />
              <Link
                href="/messages"
                prefetch
                onClick={() => beginNavigation("/messages")}
                className="text-muted-foreground hover:text-foreground rounded-full p-2.5"
                aria-label={t("messages")}
              >
                <Mail className="size-5" />
              </Link>
              <div className="bg-border mx-1 hidden h-8 w-px md:block" />
              <InvestorHeaderProfileMenu />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] flex-1 px-5 py-8 md:px-10">
          {isNavigating && pendingHref ? (
            <InvestorNavigatingSkeleton href={pendingHref} />
          ) : (
            <div key={pathname}>{children}</div>
          )}
        </main>
      </div>
    </div>
  );
}
