import { useMutation, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { PredictionDto } from "@/features/market/model/prediction-types";
import { marketKeys } from "./keys";

export function useGeneratePrediction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      securityId,
      forceRefresh = false,
    }: {
      securityId: string;
      forceRefresh?: boolean;
    }) => {
      const { data } = await browserApi.post<PredictionDto>(
        "/v1/predictions/generate",
        { securityId, forceRefresh },
      );
      return data;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: [...marketKeys.all, "prediction", vars.securityId],
      });
    },
  });
}
