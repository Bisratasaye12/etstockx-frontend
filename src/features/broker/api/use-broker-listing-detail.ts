import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { ListingDetailDto } from "@/features/broker/model/listing-detail-types";
import { brokerKeys } from "./keys";

export function useBrokerListingDetail(listingId: string, enabled = true) {
  return useQuery({
    queryKey: brokerKeys.listingDetail(listingId),
    enabled: enabled && listingId.length > 0,
    queryFn: async () => {
      const { data } = await browserApi.get<ListingDetailDto>(
        `/v1/market/listings/${listingId}`,
      );
      return data;
    },
  });
}
