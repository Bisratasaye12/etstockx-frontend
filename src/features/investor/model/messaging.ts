/** Messaging DTOs — aligned with OpenAPI `ConversationDto`, `MessageDto`, `AttachmentDto`. */

export interface InvestorMessageAttachmentDto {
  id: string;
  messageId: string;
  fileName: string | null;
  fileType: string | null;
  sizeBytes: number;
  uploadedAt: string;
}

export interface InvestorMessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  sentAt: string;
  readAt: string | null;
  attachments: InvestorMessageAttachmentDto[] | null;
}

export interface InvestorConversationDto {
  id: string;
  counterpartyId: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface InvestorPagedResult<T> {
  items: T[] | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
