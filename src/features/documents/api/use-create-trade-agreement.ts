import { useMutation, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import { documentsKeys } from "./keys";
import type { TradeAgreementDto } from "@/features/documents/model/types";

interface CreateAgreementInput {
  requestId: string;
  requestType: "BuyRequest" | "SellRequest";
}

export function useCreateTradeAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAgreementInput) => {
      const { data } = await browserApi.post<TradeAgreementDto>(
        "/v1/documents/trade-agreements",
        input,
      );
      return data;
    },
    onSuccess: (data, variables) => {
      void qc.invalidateQueries({
        queryKey: documentsKeys.byRequest(
          variables.requestId,
          variables.requestType,
        ),
      });
      void qc.invalidateQueries({ queryKey: documentsKeys.byId(data.id) });
    },
  });
}
