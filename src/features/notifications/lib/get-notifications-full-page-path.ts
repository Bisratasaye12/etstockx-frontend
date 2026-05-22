import type { UserRole } from "@/shared/api/types";
import {
  isAdminRole,
  isBrokerPortalRole,
  isClientRole,
} from "@/shared/lib/user-role";

/** Full notification history route (opened from the header bell). */
export function getNotificationsFullPagePath(
  role: UserRole | undefined,
): string {
  if (isAdminRole(role)) {
    return "/profile/admin/notifications/history";
  }
  if (isBrokerPortalRole(role)) {
    return "/profile/broker/notifications/history";
  }
  if (isClientRole(role)) {
    return "/profile/client/notifications/history";
  }
  return "/dashboard";
}
