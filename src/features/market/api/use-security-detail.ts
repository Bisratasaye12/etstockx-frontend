import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { SecurityDto } from "@/features/market/model/security-types";
import { marketKeys } from "./keys";

export function useSecurityDetail(securityId: string, enabled = true) {
  return useQuery({
    queryKey: marketKeys.securityDetail(securityId),
    enabled: enabled && securityId.length > 0,
    queryFn: async () => {
      const { data } = await browserApi.get<SecurityDto>(
        `/v1/market/securities/${securityId}`,
      );
      return data;
    },
  });
}
