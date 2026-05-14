import { useQuery } from "@tanstack/react-query";
import { messagingKeys } from "@/features/messaging/api/keys";
import { fetchUnreadMessageCount } from "@/features/messaging/api/fetch-unread-message-count";

/** Shared unread aggregate for investor + broker shells (same query key as send-message invalidation). */
export function useUnreadMessageTotal(enabled: boolean) {
  return useQuery({
    queryKey: messagingKeys.unreadTotal(),
    enabled,
    staleTime: 30_000,
    queryFn: fetchUnreadMessageCount,
  });
}
