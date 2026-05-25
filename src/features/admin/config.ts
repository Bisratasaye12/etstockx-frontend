import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  ShieldCheck,
  ScrollText,
  Users,
  Landmark,
} from "lucide-react";

/**
 * Admin sidebar navigation — placeholder entries only.
 * Replace `href` / add items when wiring real modules.
 */
type AdminNavItem = {
  href: string;
  labelKey:
    | "navOverview"
    | "navBrokers"
    | "navListings"
    | "navSecurities"
    | "navAudit"
    | "navManageAdmins";
  icon: LucideIcon;
};

const baseAdminNavItems: readonly AdminNavItem[] = [
  { href: "/admin/overview", labelKey: "navOverview", icon: LayoutGrid },
  { href: "/admin/brokers", labelKey: "navBrokers", icon: ShieldCheck },
  { href: "/admin/securities", labelKey: "navSecurities", icon: Landmark },
  { href: "/admin/audit-logs", labelKey: "navAudit", icon: ScrollText },
];

const superAdminNavItem: AdminNavItem = {
  href: "/admin/users",
  labelKey: "navManageAdmins",
  icon: Users,
};

export function getAdminNavItems(
  isSuperAdmin: boolean,
): readonly AdminNavItem[] {
  return isSuperAdmin
    ? [...baseAdminNavItems, superAdminNavItem]
    : baseAdminNavItems;
}
