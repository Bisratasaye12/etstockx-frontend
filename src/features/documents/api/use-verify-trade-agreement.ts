import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import { documentsKeys } from "./keys";
import type { TradeAgreementVerificationDto } from "@/features/documents/model/types";

export function useVerifyTradeAgreement(
  documentNumber: string,
  hash: string,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: documentsKeys.verify(documentNumber, hash),
    enabled:
      enabled && documentNumber.trim().length > 0 && hash.trim().length > 0,
    queryFn: async () => {
      const { data } = await browserApi.get<TradeAgreementVerificationDto>(
        "/v1/documents/trade-agreements/verify",
        { params: { documentNumber, hash } },
      );
      return data;
    },
  });
}
