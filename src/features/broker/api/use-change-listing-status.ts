import { useMutation, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import { brokerKeys } from "./keys";

export type ListingStatusAction = "pause" | "resume" | "close";

export interface ChangeListingStatusPayload {
  listingId: string;
  action: ListingStatusAction;
}

export function useChangeListingStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ChangeListingStatusPayload) => {
      await browserApi.patch(
        `/v1/market/listings/${payload.listingId}/status`,
        {
          action: payload.action,
        },
      );
    },
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({ queryKey: brokerKeys.all, exact: false });
      await qc.invalidateQueries({
        queryKey: brokerKeys.listingDetail(variables.listingId),
        exact: false,
      });
    },
  });
}
