import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { NotificationItem } from "@/entities/notification/model/types";
import { notificationKeys } from "./keys";

export function useNotificationsUnreadList(limit: number, enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.unreadList(limit),
    enabled,
    staleTime: 15_000,
    queryFn: async () => {
      const { data } = await browserApi.get<NotificationItem[]>(
        "/v1/notifications/unread",
        { params: { limit } },
      );
      return data ?? [];
    },
  });
}
