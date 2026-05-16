import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { AdminProfile } from "@/shared/api/types";
import { profileKeys } from "./keys";

export function useAdminProfile() {
  return useQuery({
    queryKey: profileKeys.adminMe(),
    queryFn: async () => {
      const { data } = await browserApi.get<AdminProfile>(
        "/v1/profiles/admin/me",
      );
      return data;
    },
  });
}
