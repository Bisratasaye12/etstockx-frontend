import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { BrokerProfile } from "@/shared/api/types";
import { brokerKeys } from "./keys";

export function useBrokerProfile() {
  return useQuery({
    queryKey: brokerKeys.brokerProfile(),
    queryFn: async () => {
      const { data } = await browserApi.get<BrokerProfile>(
        "/v1/profiles/broker/me",
      );
      return data;
    },
  });
}
