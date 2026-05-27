import { useMutation, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import { documentsKeys } from "./keys";
import type { TradeAgreementDto } from "@/features/documents/model/types";

interface SignAgreementInput {
  agreementId: string;
  typedFullName: string;
  acceptedTerms: boolean;
}

export function useSignTradeAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SignAgreementInput) => {
      const { data } = await browserApi.post<TradeAgreementDto>(
        `/v1/documents/trade-agreements/${input.agreementId}/sign`,
        {
          typedFullName: input.typedFullName,
          acceptedTerms: input.acceptedTerms,
        },
      );
      return data;
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: documentsKeys.byId(data.id) });
      void qc.invalidateQueries({
        queryKey: documentsKeys.byRequest(data.requestId, data.requestType),
      });
    },
  });
}
