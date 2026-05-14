import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { NotificationUnreadCountResponse } from "@/entities/notification/model/types";
import { notificationKeys } from "./keys";

export function useNotificationUnreadCount(enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    enabled,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await browserApi.get<NotificationUnreadCountResponse>(
        "/v1/notifications/unread-count",
      );
      return data.unreadCount ?? 0;
    },
  });
}
