export const notificationKeys = {
  all: ["notifications"] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
  unreadList: (limit: number) =>
    [...notificationKeys.all, "unread-list", limit] as const,
  paged: (params: {
    channel: string | undefined;
    page: number;
    pageSize: number;
  }) => [...notificationKeys.all, "paged", params] as const,
  preferences: () => [...notificationKeys.all, "preferences"] as const,
};
