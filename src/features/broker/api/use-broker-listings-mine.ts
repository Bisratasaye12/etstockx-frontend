import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { ListingSummaryDtoPagedResult } from "@/features/broker/model/listing-types";
import { brokerKeys } from "./keys";

export function useBrokerListingsMine(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: brokerKeys.listingsMine(page, pageSize),
    queryFn: async () => {
      const { data } = await browserApi.get<ListingSummaryDtoPagedResult>(
        "/v1/market/listings/mine",
        { params: { page, pageSize } },
      );
      return data;
    },
  });
}
