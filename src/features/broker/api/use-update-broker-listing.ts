import { useMutation, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { UpdateListingRequestDto } from "@/features/broker/model/listing-detail-types";
import { brokerKeys } from "./keys";

export interface UpdateBrokerListingPayload {
  listingId: string;
  body: UpdateListingRequestDto;
}

export function useUpdateBrokerListing() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateBrokerListingPayload) => {
      await browserApi.put(
        `/v1/market/listings/${payload.listingId}`,
        payload.body,
      );
    },
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({
        queryKey: brokerKeys.listingsMine(1, 200),
        exact: false,
      });
      await qc.invalidateQueries({
        queryKey: brokerKeys.listingDetail(variables.listingId),
        exact: false,
      });
    },
  });
}
