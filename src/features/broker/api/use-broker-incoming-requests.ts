import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { IncomingRequestDtoPagedResult } from "@/features/broker/model/types";
import { brokerKeys } from "./keys";

export function useBrokerIncomingRequests(page = 1, pageSize = 5) {
  return useQuery({
    queryKey: brokerKeys.incoming(page, pageSize),
    queryFn: async () => {
      const { data } = await browserApi.get<IncomingRequestDtoPagedResult>(
        "/v1/trade/broker/incoming",
        { params: { page, pageSize } },
      );
      return data;
    },
  });
}
