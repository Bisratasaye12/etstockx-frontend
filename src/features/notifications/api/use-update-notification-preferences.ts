import { useMutation, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { UpdateNotificationPreferencesRequest } from "@/entities/notification/model/types";
import { notificationKeys } from "./keys";

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: UpdateNotificationPreferencesRequest) => {
      await browserApi.put("/v1/notifications/preferences", body);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
}
