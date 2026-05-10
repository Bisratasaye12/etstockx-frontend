"use client";

import { useEffect, type ComponentType, type ReactNode } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  Bell,
  CircleHelp,
  Eye,
  LayoutGrid,
  List,
  MessageSquare,
  Settings,
  Users,
  ArrowLeftRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";
import type { UserRole } from "@/shared/api/types";
import { Input } from "@/shared/ui/input";

type ShellItem = {
  key: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

const CLIENT_BASE_ITEMS: ShellItem[] = [
  { key: "overview", href: "/dashboard", icon: LayoutGrid },
  { key: "listings", href: "/market", icon: List },
  { key: "brokers", href: "/brokers", icon: Users },
  { key: "requests", href: "/dashboard", icon: ArrowLeftRight },
  { key: "messages", href: "/dashboard", icon: MessageSquare },
  { key: "watchlist", href: "/dashboard", icon: Eye },
];

const BROKER_BASE_ITEMS: ShellItem[] = [
  { key: "overview", href: "/dashboard", icon: LayoutGrid },
  { key: "listings", href: "/market", icon: List },
  { key: "requests", href: "/dashboard", icon: ArrowLeftRight },
  { key: "messages", href: "/dashboard", icon: MessageSquare },
];

const ADMIN_ITEMS: ShellItem[] = [
  { key: "overview", href: "/dashboard", icon: LayoutGrid },
  { key: "account", href: "/admin/brokers", icon: Settings },
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
    pathname.startsWith("/brokers")
  );
}

function getItemsForRole(
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

  return [
    ...CLIENT_BASE_ITEMS,
    {
      key: isProfilePage ? "settings" : "account",
      href: "/profile/client",
      icon: Settings,
    },
  ];
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname.startsWith("/dashboard");
  return pathname.startsWith(href);
}

/** Locale-stripped path from next-intl; landing is `/`. */
function isLandingPage(pathname: string): boolean {
  return pathname === "/" || pathname === "";
}

export function AuthenticatedShell({
  children,
  role,
  accessToken: serverAccessToken,
}: AuthenticatedShellProps) {
  const { data: session, status } = useSession();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const accessToken = serverAccessToken ?? session?.accessToken;
  useEffect(() => {
    if (status === "loading") return;
    console.log(
      "accessToken",
      status === "authenticated" ? accessToken : undefined,
    );
  }, [status, accessToken]);
  const sessionRole = session?.user?.role as UserRole | undefined;
  const effectiveRole = role ?? sessionRole;
  const items = getItemsForRole(effectiveRole, pathname);
  const showSearch = shouldShowSearch(pathname);
  const onLanding = isLandingPage(pathname);

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
              {items.map((item) => {
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
