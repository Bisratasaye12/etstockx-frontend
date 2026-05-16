"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { LogOut, Mail, Plus, Search, Settings } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useAppLogout } from "@/features/auth/hooks/use-app-logout";
import { Link } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
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

  const settingsActive = isNavigating
    ? pendingHref?.startsWith("/profile/client")
    : pathname.startsWith("/profile/client");

  return (
    <div className="bg-muted/30 flex min-h-screen w-full">
      <aside className="border-border bg-card hidden w-64 shrink-0 flex-col border-r md:flex">
        <div className="px-6 pt-3 pb-2">
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
          <p className="text-muted-foreground mt-1 ml-1 mb-4 text-sm">
            {tShell("panelSubtitle")}
          </p>
        </div>
        <div className="px-4 pb-5">
          <Link
            href="/requests/new"
            prefetch
            onClick={() => beginNavigation("/requests/new")}
            className={cn(
              buttonVariants({ variant: "default", size: "default" }),
              "h-11 w-full gap-2 rounded-full text-sm font-semibold shadow-none",
            )}
          >
            <Plus className="size-4" aria-hidden />
            {tShell("newRequest")}
          </Link>
        </div>
        <InvestorSidebarNav
          items={INVESTOR_PORTAL_NAV}
          isItemActive={isItemActive}
          onNavClick={beginNavigation}
        />
        <div className="border-border mt-auto border-t px-3 py-4">
          <Link
            href="/profile/client"
            prefetch
            onClick={() => beginNavigation("/profile/client")}
            className={cn(
              "text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition-colors",
              settingsActive && "bg-primary/15 text-primary font-semibold",
            )}
          >
            <Settings className="size-5 shrink-0" />
            <span>{t("settings")}</span>
          </Link>
          <button
            type="button"
            disabled={logoutPending}
            onClick={() => void logout(`/${locale}/login`)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/80 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[15px] transition-colors"
          >
            <LogOut className="size-5 shrink-0" />
            <span>{t("signOut")}</span>
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
                  placeholder={tShell("searchPlaceholder")}
                  className="border-border bg-background h-11 rounded-full pl-10 shadow-sm"
                  aria-label={tShell("searchPlaceholder")}
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
