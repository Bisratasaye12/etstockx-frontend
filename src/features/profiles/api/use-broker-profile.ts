import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { BrokerProfile } from "@/shared/api/types";
import { profileKeys } from "./keys";

export function useBrokerProfile() {
  return useQuery({
    queryKey: profileKeys.brokerMe(),
    queryFn: async () => {
      const { data } = await browserApi.get<BrokerProfile>(
        "/v1/profiles/broker/me",
      );
      return data;
    },
  });
}
