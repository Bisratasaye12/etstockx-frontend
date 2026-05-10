import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { BrokerRequestDetailDto } from "@/features/broker/model/types";

export function useBrokerRequestDetail(requestId: string, kind: string) {
  return useQuery({
    queryKey: ["broker", "request-detail", requestId, kind] as const,
    enabled: Boolean(requestId),
    queryFn: async () => {
      const isSell = kind.toLowerCase().includes("sell");
      const endpoint = isSell
        ? `/v1/trade/sell-requests/${requestId}`
        : `/v1/trade/buy-requests/${requestId}`;
      const { data } = await browserApi.get<BrokerRequestDetailDto>(endpoint);
      return data;
    },
  });
}
