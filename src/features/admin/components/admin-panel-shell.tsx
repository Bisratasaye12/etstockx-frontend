"use client";

import Image from "next/image";
import { type ReactNode, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { LogOut, Settings } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useAppLogout } from "@/features/auth/hooks/use-app-logout";
import { Link, usePathname } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";
import { isSuperAdminRole } from "@/shared/lib/user-role";
import { getAdminNavItems } from "@/features/admin/config";
import { AdminNavigatingSkeleton } from "@/features/admin/components/admin-skeletons";
import { NotificationBellDropdown } from "@/features/notifications/components/notification-bell-dropdown";
import { getNotificationsFullPagePath } from "@/features/notifications/lib/get-notifications-full-page-path";
import type { UserRole } from "@/shared/api/types";
import { useSidebarCollapsed } from "@/shared/hooks/use-sidebar-collapsed";
import {
  portalSidebarAsideClass,
  portalSidebarFooterActionLabelClass,
  portalSidebarNavLabelClass,
  portalSidebarNavRowClass,
} from "@/shared/lib/sidebar-layout";
import { DashboardHeaderProfileMenu } from "@/shared/ui/dashboard-header-profile-menu";
import { SidebarCollapseToggle } from "@/shared/ui/sidebar-collapse-toggle";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";

function isActiveAdminNav(pathname: string, href: string): boolean {
  if (href === "/admin/overview") {
    return pathname === "/admin" || pathname === "/admin/overview";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AdminPanelShellProps = {
  children: ReactNode;
};

export function AdminPanelShell({ children }: AdminPanelShellProps) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const isNavigating =
    pendingHref !== null && !isActiveAdminNav(pathname, pendingHref);

  const locale = useLocale();
  const { data: session, status } = useSession();
  const { logout, pending: logoutPending } = useAppLogout();
  const sessionRole = session?.user?.role as UserRole | undefined;
  const isSuperAdmin = isSuperAdminRole(session?.user?.rawRole);
  const navItems = getAdminNavItems(isSuperAdmin);
  const tShell = useTranslations("admin");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const { collapsed } = useSidebarCollapsed();

  return (
    <div className="bg-muted/30 flex min-h-screen w-full items-stretch">
      <aside className={portalSidebarAsideClass(collapsed, "hidden md:flex")}>
        <div
          className={cn(
            "shrink-0 pt-3 pb-2",
            collapsed ? "flex justify-center px-2" : "px-6",
          )}
        >
          <Link
            href="/admin/overview"
            prefetch
            onClick={() => setPendingHref("/admin/overview")}
            className={cn(
              "relative block h-9 shrink-0",
              collapsed ? "w-9" : "w-[148px]",
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
            <p className="text-muted-foreground mt-1 ml-1 text-sm font-medium">
              {tShell("shell.brandSubtitle")}
            </p>
          ) : null}
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-1 px-3">
          {navItems.map((item) => {
            const active = isNavigating
              ? pendingHref === item.href
              : isActiveAdminNav(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onClick={() => setPendingHref(item.href)}
                title={collapsed ? tShell(`shell.${item.labelKey}`) : undefined}
                className={portalSidebarNavRowClass(collapsed, active)}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span className={portalSidebarNavLabelClass(collapsed)}>
                  {tShell(`shell.${item.labelKey}`)}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-border shrink-0 border-t px-3 py-4">
          <Link
            href="/profile/admin"
            title={collapsed ? tNav("settings") : undefined}
            className={portalSidebarNavRowClass(
              collapsed,
              pathname.startsWith("/profile/admin"),
            )}
          >
            <Settings className="size-5 shrink-0" aria-hidden />
            <span className={portalSidebarNavLabelClass(collapsed)}>
              {tNav("settings")}
            </span>
          </Link>
          <button
            type="button"
            disabled={status === "loading" || logoutPending}
            title={collapsed ? tNav("signOut") : undefined}
            onClick={() => void logout(`/${locale}/login`)}
            className={cn(
              portalSidebarNavRowClass(collapsed),
              "cursor-pointer text-left disabled:opacity-50",
            )}
          >
            <LogOut className="size-5 shrink-0" aria-hidden />
            <span className={portalSidebarFooterActionLabelClass(collapsed)}>
              {tNav("signOut")}
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
              <LocaleSwitcher />
              <NotificationBellDropdown
                viewAllHref={getNotificationsFullPagePath(sessionRole)}
                enabled={status === "authenticated"}
              />
              <div className="bg-border mx-1 hidden h-8 w-px md:block" />
              <DashboardHeaderProfileMenu profileHref="/profile/admin" />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] flex-1 px-5 py-8 md:px-10">
          {isNavigating && pendingHref ? (
            <AdminNavigatingSkeleton href={pendingHref} />
          ) : (
            <div key={pathname}>{children}</div>
          )}
        </main>
      </div>
    </div>
  );
}
