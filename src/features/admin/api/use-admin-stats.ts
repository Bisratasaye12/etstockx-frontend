import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type {
  AdminStatsDto,
  AdminStatsParams,
} from "@/shared/api/dtos/admin-stats";

export const adminStatsKeys = {
  all: ["admin", "stats"] as const,
  overview: (params: AdminStatsParams) =>
    [...adminStatsKeys.all, "overview", params] as const,
};

function buildParams(params: AdminStatsParams): Record<string, string> {
  const p: Record<string, string> = {};
  if (params.from?.trim()) p.from = params.from.trim();
  if (params.to?.trim()) p.to = params.to.trim();
  if (params.granularity) p.granularity = params.granularity;
  return p;
}

export function useAdminStats(params: AdminStatsParams = {}) {
  return useQuery({
    queryKey: adminStatsKeys.overview(params),
    queryFn: async () => {
      const { data } = await browserApi.get<AdminStatsDto>("/v1/stats/admin", {
        params: buildParams(params),
      });
      return data;
    },
    staleTime: 60_000,
  });
}
