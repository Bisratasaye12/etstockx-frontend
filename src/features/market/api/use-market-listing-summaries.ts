import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { ListingSummaryDto } from "@/features/market/model/types";
import { marketKeys } from "./keys";

type Paged<T> = {
  items: T[] | null;
  total: number;
  page: number;
  pageSize: number;
};

const DEFAULT_CATALOG_PAGE_SIZE = 120;

/**
 * Cached catalog slice for mapping listing IDs (e.g. watchlist) to names and prices.
 * Pass a larger `pageSize` on the watchlist page so more saved IDs resolve to summaries.
 */
export function useMarketListingSummaries(options?: {
  enabled?: boolean;
  pageSize?: number;
}) {
  const pageSize = options?.pageSize ?? DEFAULT_CATALOG_PAGE_SIZE;
  return useQuery({
    queryKey: marketKeys.listingCatalog(1, pageSize),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await browserApi.get<Paged<ListingSummaryDto>>(
        "/v1/market/listings",
        { params: { page: 1, pageSize } },
      );
      return data.items ?? [];
    },
  });
}

export function listingSummariesById(
  items: ListingSummaryDto[] | undefined,
): Map<string, ListingSummaryDto> {
  const map = new Map<string, ListingSummaryDto>();
  if (!items) return map;
  for (const row of items) map.set(row.id, row);
  return map;
}
