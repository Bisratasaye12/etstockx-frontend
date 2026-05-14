import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { ConversationPagedResult } from "@/entities/messaging/model/types";
import { messagingKeys } from "./keys";

type Params = {
  page: number;
  pageSize: number;
  enabled?: boolean;
};

/**
 * GET /v1/messages/conversations — paged conversation list for the current user.
 * Each item includes the resolved counterparty display name, last-message
 * preview, last-message timestamp, and unread count (see `ConversationDto`).
 */
export function useConversations({ page, pageSize, enabled = true }: Params) {
  return useQuery({
    queryKey: messagingKeys.conversations({ page, pageSize }),
    enabled,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data } = await browserApi.get<ConversationPagedResult>(
        "/v1/messages/conversations",
        { params: { page, pageSize } },
      );
      return data;
    },
  });
}
