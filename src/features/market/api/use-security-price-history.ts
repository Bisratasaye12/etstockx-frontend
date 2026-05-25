import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { SecurityPriceSnapshotDto } from "@/features/market/model/price-history-types";
import { marketKeys } from "./keys";

export function useSecurityPriceHistory(
  securityId: string,
  limit = 100,
  enabled = true,
) {
  return useQuery({
    queryKey: marketKeys.securityPriceHistory(securityId, limit),
    enabled: enabled && securityId.length > 0,
    queryFn: async () => {
      const { data } = await browserApi.get<SecurityPriceSnapshotDto[]>(
        `/v1/market/securities/${securityId}/price-history`,
        { params: { limit } },
      );
      return data;
    },
  });
}
