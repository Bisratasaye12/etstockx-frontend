/**
 * Messaging domain shapes. Aligned with the backend Messaging tag in
 * `.tmp-swagger.json` (`ConversationDto`, `MessageDto`, `AttachmentDto`,
 * `SendMessageRequest`).
 */

export interface AttachmentDto {
  id: string;
  messageId: string;
  fileName: string | null;
  fileType: string | null;
  sizeBytes: number;
  uploadedAt: string;
}

export interface ConversationDto {
  id: string;
  counterpartyId: string;
  /** Resolved display name of the conversation counterparty (nullable). */
  counterpartyName: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  /** Resolved display name of the sender (nullable). */
  senderName: string | null;
  content: string | null;
  sentAt: string;
  readAt: string | null;
  attachments: AttachmentDto[] | null;
}

export interface MessagingPagedResult<T> {
  items: T[] | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type ConversationPagedResult = MessagingPagedResult<ConversationDto>;
export type MessagePagedResult = MessagingPagedResult<MessageDto>;

export interface SendMessageRequest {
  /** Supply this to reply to an existing conversation. */
  conversationId?: string | null;
  /** Supply this (instead of `conversationId`) to start a new conversation. */
  recipientId?: string | null;
  content?: string | null;
}
