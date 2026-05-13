/** Shapes aligned with `NotificationDto` from the API (see `.tmp-swagger.json`). */

export interface NotificationItem {
  id: string;
  eventType: string | null;
  channel: string | null;
  title: string | null;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  sentAt: string;
  readAt: string | null;
}

export interface NotificationPagedResult {
  items: NotificationItem[] | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface NotificationUnreadCountResponse {
  unreadCount: number;
}
