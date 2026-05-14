import { useMutation, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import { brokerKeys } from "./keys";

export type BrokerOrderTargetStatus =
  | "ForwardedToESX"
  | "PartiallyFilled"
  | "Filled"
  | "Rejected";

export interface UpdateBrokerOrderStatusPayload {
  requestId: string;
  requestType: 0 | 1;
  targetStatus: BrokerOrderTargetStatus;
  filledQuantity?: number | null;
  actualPrice?: number | null;
  notes?: string | null;
}

export function useUpdateBrokerOrderStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateBrokerOrderStatusPayload) => {
      await browserApi.patch(
        `/v1/trade/broker/orders/${payload.requestId}/status`,
        {
          requestType: payload.requestType,
          targetStatus: payload.targetStatus,
          filledQuantity: payload.filledQuantity ?? null,
          actualPrice: payload.actualPrice ?? null,
          notes: payload.notes ?? null,
        },
      );
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: ["broker", "request-detail", variables.requestId],
        exact: false,
      });
      void qc.invalidateQueries({ queryKey: brokerKeys.all, exact: false });
    },
  });
}
