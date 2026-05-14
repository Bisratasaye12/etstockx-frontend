"use client";

import { type ComponentType, type ReactNode, useEffect } from "react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import {
  Bell,
  CircleHelp,
  ClipboardList,
  Contact,
  Eye,
  LayoutGrid,
  List,
  LogOut,
  Mail,
  MessageSquare,
  Search,
  Settings,
  ArrowLeftRight,
  Plus,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";
import type { UserRole } from "@/shared/api/types";
import { Input } from "@/shared/ui/input";
import { buttonVariants } from "@/shared/ui/button";
import { useInvestorUnreadBadge } from "@/features/investor/api/use-investor-unread-badge";
import { InvestorHeaderProfileMenu } from "@/features/investor/components/investor-header-profile-menu";

type ShellItem = {
  key: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

const INVESTOR_NAV_ITEMS: ShellItem[] = [
  { key: "overview", href: "/dashboard", icon: LayoutGrid },
  { key: "listings", href: "/market", icon: List },
  { key: "brokers", href: "/brokers", icon: Contact },
  { key: "myRequests", href: "/requests", icon: ClipboardList },
  { key: "watchlist", href: "/watchlist", icon: Eye },
  { key: "messages", href: "/messages", icon: MessageSquare },
];

const BROKER_BASE_ITEMS: ShellItem[] = [
  { key: "overview", href: "/dashboard", icon: LayoutGrid },
  { key: "listings", href: "/market", icon: List },
  { key: "requests", href: "/dashboard", icon: ArrowLeftRight },
  { key: "messages", href: "/dashboard", icon: MessageSquare },
];

const ADMIN_ITEMS: ShellItem[] = [
  { key: "overview", href: "/admin/overview", icon: LayoutGrid },
  { key: "settings", href: "/admin/settings", icon: Settings },
];

type AuthenticatedShellProps = {
  children: ReactNode;
  role?: UserRole;
  accessToken?: string;
};

function shouldShowSearch(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/market") ||
    pathname.startsWith("/brokers") ||
    pathname.startsWith("/requests") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/watchlist") ||
    pathname.startsWith("/profile/client")
  );
}

function getPrimaryNavItems(
  role: UserRole | undefined,
  pathname: string,
): ShellItem[] {
  const isProfilePage = pathname.startsWith("/profile");

  if (role === "Admin") return ADMIN_ITEMS;
  if (role === "Broker" || role === "Dealer") {
    return [
      ...BROKER_BASE_ITEMS,
      {
        key: isProfilePage ? "settings" : "account",
        href: "/profile/broker",
        icon: Settings,
      },
    ];
  }

  return INVESTOR_NAV_ITEMS;
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isLandingPage(pathname: string): boolean {
  return pathname === "/" || pathname === "";
}

export function AuthenticatedShell({
  children,
  role,
  accessToken: serverAccessToken,
}: AuthenticatedShellProps) {
  const { data: session, status } = useSession();
  const locale = useLocale();
  const t = useTranslations("nav");
  const tShell = useTranslations("investor.shell");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const accessToken = serverAccessToken ?? session?.accessToken;

  useEffect(() => {
    if (status === "loading") return;
    // console.log(
    //   "accessToken",
    //   status === "authenticated" ? accessToken : undefined,
    // );
  }, [status, accessToken]);

  const sessionRole = session?.user?.role as UserRole | undefined;
  const effectiveRole = role ?? sessionRole;
  const isAdminPanelRoute =
    effectiveRole === "Admin" && pathname.startsWith("/admin");

  const primaryNav = getPrimaryNavItems(effectiveRole, pathname);
  const showSearch = shouldShowSearch(pathname);
  const onLanding = isLandingPage(pathname);
  const investorChrome = effectiveRole === "Client" && !onLanding;

  const { data: unreadBadge } = useInvestorUnreadBadge(
    investorChrome && Boolean(session?.user?.isActivated),
  );

  const settingsHref =
    effectiveRole === "Broker" || effectiveRole === "Dealer"
      ? "/profile/broker"
      : "/profile/client";

  if (isAdminPanelRoute) {
    return <div className="bg-muted/30 min-h-screen w-full">{children}</div>;
  }

  if (investorChrome) {
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
              href="/requests"
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "h-11 w-full rounded-full text-sm font-semibold shadow-none gap-2",
              )}
            >
              <Plus className="size-4" aria-hidden />
              {tShell("newRequest")}
            </Link>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-3">
            {primaryNav.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={`${item.key}-${item.href}`}
                  href={item.href}
                  className={cn(
                    "text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition-colors",
                    active && "bg-primary/15 text-primary font-semibold",
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  <span>{t(item.key)}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-border mt-auto border-t px-3 py-4">
            <Link
              href={settingsHref}
              className={cn(
                "text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition-colors",
                pathname.startsWith(settingsHref) &&
                  "bg-primary/15 text-primary font-semibold",
              )}
            >
              <Settings className="size-5 shrink-0" />
              <span>{t("settings")}</span>
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
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
                {showSearch ? (
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
                ) : (
                  <div className="flex-1" />
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1 md:gap-2">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground relative rounded-full p-2.5"
                  aria-label={t("notifications")}
                >
                  <Bell className="size-5" />
                  {(unreadBadge ?? 0) > 0 ? (
                    <span className="bg-destructive absolute top-2 right-2 size-2 rounded-full ring-2 ring-background" />
                  ) : null}
                </button>
                <Link
                  href="/messages"
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
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/20 flex min-h-screen flex-col">
      <header className="border-border bg-card sticky top-0 z-50 border-b">
        <div className="flex h-14 items-center gap-4 px-4 md:h-16 md:px-6">
          <Link href="/" className="flex shrink-0 items-center">
            <span className="relative block h-9 w-[168px] sm:h-10 sm:w-[188px]">
              <Image
                src="/EtStockX.svg"
                alt={tCommon("appName")}
                fill
                className="object-contain object-left"
                sizes="(max-width: 640px) 168px, 188px"
                unoptimized
                priority
              />
            </span>
          </Link>
          {showSearch ? (
            <div className="mx-auto w-full max-w-xl">
              <Input placeholder={t("searchPlaceholder")} className="h-10" />
            </div>
          ) : (
            <div className="flex-1" />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground rounded-md p-2"
              aria-label={t("notifications")}
            >
              <Bell className="size-4" />
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground rounded-md p-2"
              aria-label={t("help")}
            >
              <CircleHelp className="size-4" />
            </button>
            <div
              className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full text-xs font-semibold"
              aria-label={t("account")}
            >
              {effectiveRole?.slice(0, 1) ?? "U"}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {!onLanding ? (
          <aside className="border-border bg-card hidden w-64 flex-col border-r md:flex">
            <nav className="space-y-1 px-4 py-6">
              {primaryNav.map((item) => {
                const active = isActivePath(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={`${item.key}-${item.href}`}
                    href={item.href}
                    className={cn(
                      "text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-3 rounded-xl px-4 py-3 text-base transition-colors",
                      active && "bg-primary/15 text-primary font-medium",
                    )}
                  >
                    <Icon className="size-5" />
                    <span>{t(item.key)}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto border-t px-4 py-4">
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-3 rounded-xl px-4 py-3 text-base transition-colors"
              >
                <CircleHelp className="size-5" />
                <span>{t("helpCenter")}</span>
              </Link>
            </div>
          </aside>
        ) : null}

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-8 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
