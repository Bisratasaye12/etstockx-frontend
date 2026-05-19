import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { NotificationPreference } from "@/entities/notification/model/types";
import { notificationKeys } from "./keys";

export function useNotificationPreferences(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    enabled,
    queryFn: async () => {
      const { data } = await browserApi.get<NotificationPreference[]>(
        "/v1/notifications/preferences",
      );
      return data ?? [];
    },
  });
}
