import { useMutation, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import { documentsKeys } from "./keys";
import type { TradeAgreementDto } from "@/features/documents/model/types";

interface CancelAgreementInput {
  agreement: TradeAgreementDto;
  reason: string;
}

export function useCancelTradeAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CancelAgreementInput) => {
      await browserApi.post(
        `/v1/documents/trade-agreements/${input.agreement.id}/cancel`,
        { reason: input.reason },
      );
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: documentsKeys.byId(variables.agreement.id),
      });
      void qc.invalidateQueries({
        queryKey: documentsKeys.byRequest(
          variables.agreement.requestId,
          variables.agreement.requestType,
        ),
      });
    },
  });
}
