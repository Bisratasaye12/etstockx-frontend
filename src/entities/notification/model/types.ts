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

/** Aligned with `NotificationPreferenceDto` from the API. */
export interface NotificationPreference {
  eventType: string | null;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  isMandatory: boolean;
}

export type NotificationPreferenceChannel =
  | "inAppEnabled"
  | "emailEnabled"
  | "smsEnabled"
  | "pushEnabled";

export interface UpdateNotificationPreferenceItem {
  eventType: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
}

export interface UpdateNotificationPreferencesRequest {
  preferences: UpdateNotificationPreferenceItem[];
}
