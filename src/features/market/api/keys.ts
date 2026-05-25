export type ListingsBrowseFilters = {
  securityId?: string;
  sector?: string;
  minPrice?: number;
  maxPrice?: number;
  minQuantity?: number;
  page: number;
  pageSize: number;
};

export type SecuritiesSearchFilters = {
  q?: string;
  sector?: string;
  page: number;
  pageSize: number;
};

export const marketKeys = {
  all: ["market"] as const,
  /** Small slice for watchlist / dashboard enrichment (stable cache). */
  listingCatalog: (page: number, pageSize: number) =>
    [...marketKeys.all, "catalog", page, pageSize] as const,
  listingBrowse: (f: ListingsBrowseFilters) =>
    [...marketKeys.all, "browse", f] as const,
  listingSearch: (q: string, page: number, pageSize: number) =>
    [...marketKeys.all, "search", q, page, pageSize] as const,
  listingDetail: (id: string) => [...marketKeys.all, "detail", id] as const,
  securities: (f: SecuritiesSearchFilters) =>
    [...marketKeys.all, "securities", f] as const,
  securityDetail: (id: string) => [...marketKeys.all, "security", id] as const,
  securityPriceHistory: (id: string, limit: number) =>
    [...marketKeys.all, "price-history", id, limit] as const,
};
