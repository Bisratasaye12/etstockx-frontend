import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { PredictionDto } from "@/features/market/model/prediction-types";
import { marketKeys } from "./keys";

export function useSecurityPrediction(securityId: string, enabled = true) {
  return useQuery({
    queryKey: [...marketKeys.all, "prediction", securityId] as const,
    enabled: enabled && securityId.length > 0,
    retry: false,
    queryFn: async () => {
      const { data } = await browserApi.get<PredictionDto>(
        `/v1/predictions/${securityId}`,
      );
      return data;
    },
  });
}
