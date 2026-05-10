import { useQuery } from "@tanstack/react-query";
import { investorKeys } from "./keys";
import { fetchInvestorUnreadMessageCount } from "./fetch-unread-message-count";

/** Shares cache with investor dashboard stats (`investorKeys.conversationsUnread`). */
export function useInvestorUnreadBadge(enabled: boolean) {
  return useQuery({
    queryKey: investorKeys.conversationsUnread(),
    enabled,
    staleTime: 30_000,
    queryFn: fetchInvestorUnreadMessageCount,
  });
}
