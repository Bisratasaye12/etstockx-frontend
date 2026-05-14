import { useMutation, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { MessageDto } from "@/entities/messaging/model/types";
import { messagingKeys } from "./keys";

export type UploadAttachmentInput = {
  conversationId: string;
  file: File;
  caption?: string;
};

/**
 * POST /v1/messages/conversations/{conversationId}/attachments
 *
 * Sends a single file (PDF / DOCX / XLSX / JPEG / PNG, max 10 MB) as a new
 * attachment message. `browserApi` already strips Content-Type for FormData so
 * the browser sets the multipart boundary correctly.
 */
export function useUploadAttachment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      file,
      caption,
    }: UploadAttachmentInput) => {
      const formData = new FormData();
      formData.append("file", file);
      if (caption && caption.length > 0) {
        formData.append("caption", caption);
      }

      const { data } = await browserApi.post<MessageDto>(
        `/v1/messages/conversations/${conversationId}/attachments`,
        formData,
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
