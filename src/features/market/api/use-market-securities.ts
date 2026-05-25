import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { PagedSecuritiesDto } from "@/features/market/model/security-types";
import { marketKeys } from "./keys";

export function useMarketSecurities(
  q: string,
  page = 1,
  pageSize = 50,
  enabled = true,
) {
  return useQuery({
    queryKey: marketKeys.securities({ q: q || undefined, page, pageSize }),
    enabled,
    queryFn: async () => {
      const { data } = await browserApi.get<PagedSecuritiesDto>(
        "/v1/market/securities",
        {
          params: {
            q: q.trim() || undefined,
            page,
            pageSize,
          },
        },
      );
      return data;
    },
  });
}
