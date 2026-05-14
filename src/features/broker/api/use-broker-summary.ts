import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { BrokerOrderSummaryDto } from "@/features/broker/model/types";
import { brokerKeys } from "./keys";

export function useBrokerSummary() {
  return useQuery({
    queryKey: brokerKeys.summary(),
    queryFn: async () => {
      const { data } = await browserApi.get<BrokerOrderSummaryDto>(
        "/v1/trade/broker/summary",
      );
      return data;
    },
  });
}
