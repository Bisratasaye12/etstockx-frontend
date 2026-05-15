import type { UserRole } from "@/shared/api/types";
import {
  isAdminRole,
  isBrokerPortalRole,
  isClientRole,
} from "@/shared/lib/user-role";

/** Full-page notifications route for the signed-in role (API is the same for all roles). */
export function getNotificationsFullPagePath(
  role: UserRole | undefined,
): string {
  if (isAdminRole(role)) {
    return "/profile/admin/notifications";
  }
  if (isBrokerPortalRole(role)) {
    return "/profile/broker/notifications";
  }
  if (isClientRole(role)) {
    return "/profile/client/notifications";
  }
  return "/dashboard";
}
