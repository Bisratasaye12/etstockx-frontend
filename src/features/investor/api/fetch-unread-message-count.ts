/**
 * Investor-facing wrapper around the shared messaging unread aggregator. Kept
 * as a re-export under the `features/investor` slice so existing call sites
 * (`useInvestorUnreadBadge`, `useInvestorDashboardData`) remain unchanged.
 */
import { fetchUnreadMessageCount } from "@/features/messaging/api/fetch-unread-message-count";

export async function fetchInvestorUnreadMessageCount(): Promise<number> {
  return fetchUnreadMessageCount();
}
