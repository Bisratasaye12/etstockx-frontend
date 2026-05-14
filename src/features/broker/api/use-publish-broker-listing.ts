import { useMutation, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import { brokerKeys } from "./keys";

export interface PublishBrokerListingRequest {
  instrumentName: string | null;
  ticker: string | null;
  sector: string | null;
  price: number;
  currency: string | null;
  quantity: number;
  minLotSize: number | null;
  notes: string | null;
  validFrom: string | null;
  validTo: string | null;
}

export function usePublishBrokerListing() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PublishBrokerListingRequest) => {
      await browserApi.post("/v1/market/listings", payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: brokerKeys.all, exact: false });
    },
  });
}
