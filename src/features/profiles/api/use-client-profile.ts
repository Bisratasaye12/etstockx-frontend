import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { ClientProfile } from "@/shared/api/types";
import { profileKeys } from "./keys";

export function useClientProfile() {
  return useQuery({
    queryKey: profileKeys.clientMe(),
    queryFn: async () => {
      const { data } = await browserApi.get<ClientProfile>(
        "/v1/profiles/client/me",
      );
      return data;
    },
  });
}
