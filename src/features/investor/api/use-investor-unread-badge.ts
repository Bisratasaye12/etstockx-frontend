import { useQuery } from "@tanstack/react-query";
import { investorKeys } from "./keys";
import { fetchInvestorUnreadMessageCount } from "./fetch-unread-message-count";

/** Fetches unread message count for shell badges. */
export function useInvestorUnreadBadge(enabled: boolean) {
  return useQuery({
    queryKey: investorKeys.conversationsUnread(),
    enabled,
    staleTime: 30_000,
    queryFn: fetchInvestorUnreadMessageCount,
  });
}
