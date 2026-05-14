import { getPublicApiBaseUrl } from "@/shared/config/env";

/**
 * Resolves the absolute download URL for a Messaging attachment. The endpoint
 * is `GET /v1/messages/attachments/{attachmentId}`; we let the browser open it
 * directly so the bearer is attached only when access is authenticated via
 * cookie-backed refresh — for now this is used as the `href` on download
 * links inside the thread.
 */
export function getAttachmentDownloadUrl(attachmentId: string): string {
  const base = getPublicApiBaseUrl().replace(/\/$/, "");
  return `${base}/v1/messages/attachments/${attachmentId}`;
}
