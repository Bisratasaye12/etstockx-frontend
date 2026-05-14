import { useInfiniteQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { MessagePagedResult } from "@/entities/messaging/model/types";
import { messagingKeys } from "./keys";

type Params = {
  conversationId: string;
  pageSize?: number;
  enabled?: boolean;
  /**
   * Background refresh interval in ms. The Figma flow expects near-realtime
   * updates; SignalR will replace this when wired (see
   * `features/messaging/realtime/`).
   */
  refetchIntervalMs?: number;
};

/**
 * GET /v1/messages/conversations/{conversationId}/messages
 *
 * Backend paginates newest-first ("for load-more scroll"). We expose an
 * infinite query that the UI flips to chronological order at render time.
 */
export function useConversationThread({
  conversationId,
  pageSize = 30,
  enabled = true,
  refetchIntervalMs = 15_000,
}: Params) {
  return useInfiniteQuery({
    queryKey: messagingKeys.thread(conversationId, pageSize),
    enabled: enabled && Boolean(conversationId),
    initialPageParam: 1,
    refetchOnWindowFocus: true,
    refetchInterval: refetchIntervalMs,
    queryFn: async ({ pageParam }) => {
      const { data } = await browserApi.get<MessagePagedResult>(
        `/v1/messages/conversations/${conversationId}/messages`,
        { params: { page: pageParam, pageSize } },
      );
      return data;
    },
    getNextPageParam: (lastPage) => {
      const next = (lastPage.page ?? 1) + 1;
      return next <= (lastPage.totalPages ?? 1) ? next : undefined;
    },
  });
}
