import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { IncomingRequestDtoPagedResult } from "@/features/broker/model/types";
import { brokerKeys } from "./keys";

export type BrokerClientHistoryParams = {
  from?: string;
  to?: string;
  instrument?: string;
  page: number;
  pageSize: number;
};

export function useBrokerClientHistory(
  clientId: string,
  params: BrokerClientHistoryParams,
) {
  return useQuery({
    queryKey: brokerKeys.clientHistory(clientId, params),
    queryFn: async () => {
      const { data } = await browserApi.get<IncomingRequestDtoPagedResult>(
        `/v1/trade/broker/clients/${clientId}/history`,
        {
          params: {
            page: params.page,
            pageSize: params.pageSize,
            ...(params.from ? { from: params.from } : {}),
            ...(params.to ? { to: params.to } : {}),
            ...(params.instrument?.trim()
              ? { instrument: params.instrument.trim() }
              : {}),
          },
        },
      );
      return data;
    },
    enabled: Boolean(clientId),
  });
}
