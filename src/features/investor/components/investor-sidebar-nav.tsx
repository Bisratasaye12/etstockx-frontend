"use client";

import type { ComponentType } from "react";
import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";
import { useUnreadMessageTotal } from "@/features/messaging/api/use-unread-message-total";
import { useInvestorTradeRequestsList } from "@/features/investor/api/use-investor-trade-requests-list";
import type { InvestorTradeListFilters } from "@/features/investor/api/use-investor-trade-requests-list";

export type InvestorShellNavItem = {
  key: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge?: "messages" | "requests";
};

type Props = { items: InvestorShellNavItem[] };

const REQUEST_BADGE_FILTERS: InvestorTradeListFilters = {
  instrument: "",
  status: "",
  fromIso: undefined,
  toIso: undefined,
};

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function InvestorSidebarNav({ items }: Props) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { data: session } = useSession();
  const isActivated = Boolean(session?.user?.isActivated);
  const enabled = session?.user?.role === "Client" && isActivated;

  const unreadQ = useUnreadMessageTotal(enabled);
  const requestsList = useInvestorTradeRequestsList(
    enabled,
    REQUEST_BADGE_FILTERS,
  );

  const unreadTotal = unreadQ.data ?? 0;
  const pendingProposals = requestsList.pendingProposalCount;

  const badgeFor = useMemo(() => {
    return (kind: "messages" | "requests") => {
      if (kind === "messages") {
        if (isActivePath(pathname, "/messages")) return null;
        if (unreadTotal <= 0) return null;
        return Math.min(unreadTotal, 99);
      }
      if (isActivePath(pathname, "/requests")) return null;
      if (pendingProposals <= 0) return null;
      return Math.min(pendingProposals, 99);
    };
  }, [pathname, unreadTotal, pendingProposals]);

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        const badge = item.badge != null ? badgeFor(item.badge) : null;
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
            <span className="flex-1">{t(item.key)}</span>
            {badge != null ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                {badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
