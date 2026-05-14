import { useMutation, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import { messagingKeys } from "./keys";

/**
 * POST /v1/messages/conversations/{conversationId}/read — marks unread
 * messages as read for the current user. Invoked when a thread is opened so
 * the conversation list badge clears.
 */
export function useMarkConversationRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      await browserApi.post(
        `/v1/messages/conversations/${conversationId}/read`,
      );
      return conversationId;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: messagingKeys.all });
    },
  });
}
