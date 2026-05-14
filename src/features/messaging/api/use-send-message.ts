import { useMutation, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type {
  MessageDto,
  SendMessageRequest,
} from "@/entities/messaging/model/types";
import { messagingKeys } from "./keys";

/**
 * POST /v1/messages — send a text message into an existing conversation or
 * start one by supplying `recipientId` instead of `conversationId`.
 *
 * On success we invalidate every cached page of the active thread plus the
 * conversation list (so its preview and unread state refresh).
 */
export function useSendMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SendMessageRequest) => {
      const { data } = await browserApi.post<MessageDto>(
        "/v1/messages",
        payload,
      );
      return data;
    },
    onSuccess: (message) => {
      void qc.invalidateQueries({
        queryKey: messagingKeys.threadAll(message.conversationId),
      });
      void qc.invalidateQueries({ queryKey: messagingKeys.all });
    },
  });
}
