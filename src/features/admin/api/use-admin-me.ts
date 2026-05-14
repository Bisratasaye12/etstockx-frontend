import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { browserApi } from "@/shared/api/browser-api";
import type { AdminMeDto } from "@/shared/api/dtos/admin-me";

export const adminMeQueryKeys = {
  profile: ["admin", "me"] as const,
};

/**
 * Fetches GET /v1/admin/me when the API exists. Until then, a 404 is treated as no data (no error UI).
 */
export function useAdminMe() {
  return useQuery({
    queryKey: adminMeQueryKeys.profile,
    queryFn: async (): Promise<AdminMeDto | null> => {
      try {
        const { data } = await browserApi.get<AdminMeDto>("/v1/admin/me");
        return data ?? null;
      } catch (e) {
        if (isAxiosError(e) && e.response?.status === 404) {
          return null;
        }
        throw e;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
}
