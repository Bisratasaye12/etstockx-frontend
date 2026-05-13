import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { NotificationPagedResult } from "@/entities/notification/model/types";
import { notificationKeys } from "./keys";

type Params = {
  channel?: string;
  page: number;
  pageSize: number;
  enabled?: boolean;
};

export function useNotificationsPaged({
  channel,
  page,
  pageSize,
  enabled = true,
}: Params) {
  return useQuery({
    queryKey: notificationKeys.paged({ channel, page, pageSize }),
    enabled,
    queryFn: async () => {
      const { data } = await browserApi.get<NotificationPagedResult>(
        "/v1/notifications",
        {
          params: {
            page,
            pageSize,
            ...(channel ? { channel } : {}),
          },
        },
      );
      return data;
    },
  });
}
