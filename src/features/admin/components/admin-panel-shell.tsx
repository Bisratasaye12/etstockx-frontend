"use client";

import Image from "next/image";
import { type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { LogOut, Mail, Search, Settings } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useAppLogout } from "@/features/auth/hooks/use-app-logout";
import { Link, usePathname } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";
import { isSuperAdminRole } from "@/shared/lib/user-role";
import { Input } from "@/shared/ui/input";
import { getAdminNavItems } from "@/features/admin/config";
import { NotificationBellDropdown } from "@/features/notifications/components/notification-bell-dropdown";
import { getNotificationsFullPagePath } from "@/features/notifications/lib/get-notifications-full-page-path";
import type { UserRole } from "@/shared/api/types";
import { DashboardHeaderProfileMenu } from "@/shared/ui/dashboard-header-profile-menu";

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
  const locale = useLocale();
  const { data: session, status } = useSession();
  const { logout, pending: logoutPending } = useAppLogout();
  const sessionRole = session?.user?.role as UserRole | undefined;
  const isSuperAdmin = isSuperAdminRole(session?.user?.rawRole);
  const navItems = getAdminNavItems(isSuperAdmin);
  const tShell = useTranslations("admin");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");

  return (
    <div className="bg-muted/30 flex min-h-screen w-full">
      <aside className="border-border bg-card hidden w-64 shrink-0 flex-col border-r md:flex">
        <div className="px-6 pt-3 pb-2">
          <Link
            href="/admin/overview"
            className="relative block h-9 w-[148px] shrink-0"
          >
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
          <p className="text-muted-foreground mt-1 ml-1 text-sm font-medium">
            {tShell("shell.brandSubtitle")}
          </p>
        </div>

        <div className="px-4 pb-4">
          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              readOnly
              tabIndex={-1}
              placeholder={tShell("shell.sidebarSearchPlaceholder")}
              className="border-border bg-background text-muted-foreground h-10 cursor-default rounded-lg pl-9 text-sm shadow-none"
              aria-label={tShell("shell.sidebarSearchPlaceholder")}
            />
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {navItems.map((item) => {
            const active = isActiveAdminNav(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition-colors",
                  active && "bg-primary/15 text-primary font-semibold",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span>{tShell(`shell.${item.labelKey}`)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-border mt-auto border-t px-3 py-4">
          <Link
            href="/profile/admin"
            className={cn(
              "text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition-colors",
              pathname.startsWith("/profile/admin") &&
                "bg-primary/15 text-primary font-semibold",
            )}
          >
            <Settings className="size-5 shrink-0" aria-hidden />
            <span>{tNav("settings")}</span>
          </Link>
          <button
            type="button"
            disabled={status === "loading" || logoutPending}
            onClick={() => void logout(`/${locale}/login`)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/80 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[15px] transition-colors disabled:opacity-50"
          >
            <LogOut className="size-5 shrink-0" aria-hidden />
            <span>{tNav("signOut")}</span>
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur-md">
          <div className="flex h-16 items-center gap-4 px-6 md:px-8">
            <div className="flex min-w-0 flex-1 justify-center">
              <div className="relative w-full max-w-2xl">
                <Search
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  aria-hidden
                />
                <Input
                  readOnly
                  tabIndex={-1}
                  placeholder={tShell("shell.headerSearchPlaceholder")}
                  className="border-border bg-background text-muted-foreground h-11 cursor-default rounded-full pl-10 shadow-sm"
                  aria-label={tShell("shell.headerSearchPlaceholder")}
                />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 md:gap-2">
              <NotificationBellDropdown
                viewAllHref={getNotificationsFullPagePath(sessionRole)}
                enabled={status === "authenticated"}
              />
              <Link
                href="/messages"
                className="text-muted-foreground hover:text-foreground rounded-full p-2.5"
                aria-label={tNav("messages")}
              >
                <Mail className="size-5" aria-hidden />
              </Link>
              <div className="bg-border mx-1 hidden h-8 w-px md:block" />
              <DashboardHeaderProfileMenu profileHref="/profile/admin" />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] flex-1 px-5 py-8 md:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
