import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { ListingPerformanceDto } from "@/features/broker/model/listing-detail-types";
import { brokerKeys } from "./keys";

export function useListingPerformance(
  listingId: string,
  from?: string,
  to?: string,
) {
  return useQuery({
    queryKey: brokerKeys.listingPerformance(listingId, from, to),
    enabled: listingId.length > 0,
    queryFn: async () => {
      const { data } = await browserApi.get<ListingPerformanceDto>(
        `/v1/market/listings/${listingId}/performance`,
        { params: { from, to } },
      );
      return data;
    },
  });
}
