import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { BrokerDirectoryEntry } from "@/shared/api/types";
import { profileKeys } from "./keys";

export function useBrokerDirectory(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: profileKeys.brokerDirectory(),
    enabled: options?.enabled !== false,
    queryFn: async () => {
      const { data } = await browserApi.get<BrokerDirectoryEntry[]>(
        "/v1/profiles/brokers",
      );
      return data;
    },
  });
}
