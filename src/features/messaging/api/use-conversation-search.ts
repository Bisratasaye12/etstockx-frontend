import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { MessageDto } from "@/entities/messaging/model/types";
import { messagingKeys } from "./keys";

type Params = {
  conversationId: string;
  keyword: string;
  limit?: number;
  enabled?: boolean;
};

/**
 * GET /v1/messages/conversations/{conversationId}/search — in-conversation
 * keyword search returning a flat list of matching messages.
 */
export function useConversationSearch({
  conversationId,
  keyword,
  limit = 50,
  enabled = true,
}: Params) {
  const trimmed = keyword.trim();

  return useQuery({
    queryKey: messagingKeys.search(conversationId, trimmed, limit),
    enabled: enabled && Boolean(conversationId) && trimmed.length > 0,
    staleTime: 10_000,
    queryFn: async () => {
      const { data } = await browserApi.get<MessageDto[]>(
        `/v1/messages/conversations/${conversationId}/search`,
        { params: { keyword: trimmed, limit } },
      );
      return data ?? [];
    },
  });
}
