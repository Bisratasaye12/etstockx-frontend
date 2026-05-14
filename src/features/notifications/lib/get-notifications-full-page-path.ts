import type { UserRole } from "@/shared/api/types";

/** Full-page notifications route for the signed-in role (API is the same for all roles). */
export function getNotificationsFullPagePath(
  role: UserRole | undefined,
): string {
  if (role === "Broker" || role === "Dealer") {
    return "/profile/broker/notifications";
  }
  if (role === "Client") {
    return "/profile/client/notifications";
  }
  return "/dashboard";
}
