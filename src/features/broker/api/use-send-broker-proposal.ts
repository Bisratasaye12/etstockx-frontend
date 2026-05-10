import { useMutation, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";

interface SendBrokerProposalPayload {
  requestId: string;
  requestType: 0 | 1;
  proposedQuantity: number | null;
  proposedPrice: number | null;
  notes: string | null;
}

export function useSendBrokerProposal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SendBrokerProposalPayload) => {
      await browserApi.post(
        `/v1/trade/broker/requests/${payload.requestId}/proposal`,
        {
          requestType: payload.requestType,
          proposedQuantity: payload.proposedQuantity,
          proposedPrice: payload.proposedPrice,
          notes: payload.notes,
        },
      );
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: ["broker", "request-detail", variables.requestId],
        exact: false,
      });
      void qc.invalidateQueries({
        queryKey: ["broker", "incoming"],
        exact: false,
      });
    },
  });
}
