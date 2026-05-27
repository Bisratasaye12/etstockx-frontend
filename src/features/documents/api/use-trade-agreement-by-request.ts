import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import { documentsKeys } from "./keys";
import type { TradeAgreementDto } from "@/features/documents/model/types";

export function useTradeAgreementByRequest(
  requestId: string,
  requestType: "BuyRequest" | "SellRequest",
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: documentsKeys.byRequest(requestId, requestType),
    enabled: enabled && Boolean(requestId),
    queryFn: async () => {
      const res = await browserApi.get<TradeAgreementDto | null>(
        "/v1/documents/trade-agreements/by-request",
        {
          params: { requestId, requestType },
          validateStatus: (s) => s === 200 || s === 204,
        },
      );
      // 204 → no agreement yet
      if (res.status === 204) return null;
      return res.data ?? null;
    },
  });
}
