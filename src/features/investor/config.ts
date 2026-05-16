import type { ComponentType } from "react";
import {
  ClipboardList,
  Contact,
  Eye,
  LayoutGrid,
  List,
  MessageSquare,
} from "lucide-react";

export type InvestorShellNavItem = {
  key: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge?: "messages" | "requests";
};

export const INVESTOR_PORTAL_NAV: InvestorShellNavItem[] = [
  { key: "overview", href: "/dashboard", icon: LayoutGrid },
  { key: "listings", href: "/market", icon: List },
  { key: "brokers", href: "/brokers", icon: Contact },
  {
    key: "myRequests",
    href: "/requests",
    icon: ClipboardList,
    badge: "requests",
  },
  { key: "watchlist", href: "/watchlist", icon: Eye },
  {
    key: "messages",
    href: "/messages",
    icon: MessageSquare,
    badge: "messages",
  },
];

export function isInvestorPortalNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
