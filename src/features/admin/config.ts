import type { LucideIcon } from "lucide-react";
import { LayoutGrid, ShieldCheck, ListChecks, ScrollText } from "lucide-react";

/**
 * Admin sidebar navigation — placeholder entries only.
 * Replace `href` / add items when wiring real modules.
 */
export const adminNavPlaceholders: ReadonlyArray<{
  href: string;
  labelKey: "navOverview" | "navBrokers" | "navListings" | "navAudit";
  icon: LucideIcon;
}> = [
  { href: "/admin/overview", labelKey: "navOverview", icon: LayoutGrid },
  { href: "/admin/brokers", labelKey: "navBrokers", icon: ShieldCheck },
  { href: "/admin/listings", labelKey: "navListings", icon: ListChecks },
  { href: "/admin/audit-logs", labelKey: "navAudit", icon: ScrollText },
];
