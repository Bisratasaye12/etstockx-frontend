import type { UserRole } from "@/shared/api/types";

function canonicalizeRole(role: string | null | undefined): string {
  return (role ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

export function isSuperAdminRole(role: string | null | undefined): boolean {
  return canonicalizeRole(role) === "superadmin";
}

export function normalizeUserRole(
  role: string | null | undefined,
): UserRole | undefined {
  switch (canonicalizeRole(role)) {
    case "admin":
    case "superadmin":
      return "Admin";
    case "broker":
      return "Broker";
    case "dealer":
      return "Dealer";
    case "client":
    case "investor":
      return "Client";
    default:
      return undefined;
  }
}

export function isAdminRole(role: string | null | undefined): boolean {
  return normalizeUserRole(role) === "Admin";
}

export function isBrokerPortalRole(role: string | null | undefined): boolean {
  const normalized = normalizeUserRole(role);
  return normalized === "Broker" || normalized === "Dealer";
}

export function isClientRole(role: string | null | undefined): boolean {
  return normalizeUserRole(role) === "Client";
}

export function getDefaultSignedInHref(
  role: string | null | undefined,
): "/admin/overview" | "/dashboard/broker" | "/dashboard" {
  const normalized = normalizeUserRole(role);
  if (normalized === "Admin") return "/admin/overview";
  if (normalized === "Broker" || normalized === "Dealer") {
    return "/dashboard/broker";
  }
  return "/dashboard";
}
