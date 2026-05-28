import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type {
  ListingDetailDto,
  ModerateListingRequestDto,
  PagedResult,
  ListingSummaryDto,
} from "@/shared/api/dtos/admin-portal";

export const listingModerationKeys = {
  queue: (page: number, pageSize: number) =>
    ["admin", "market", "moderation-queue", page, pageSize] as const,
  detail: (id: string | null) =>
    ["admin", "market", "listing-detail", id] as const,
};

/** Normalizes API paging (camelCase vs PascalCase) so the queue is never silently empty due to casing. */
function normalizePagedListings(
  raw: unknown,
  fallbackPage: number,
  fallbackPageSize: number,
): PagedResult<ListingSummaryDto> {
  const d = raw as Record<string, unknown> | null | undefined;
  if (!d || typeof d !== "object") {
    return {
      items: [],
      total: 0,
      page: fallbackPage,
      pageSize: fallbackPageSize,
      totalPages: 0,
    };
  }
  const items = (d.items ?? d.Items) as ListingSummaryDto[] | null | undefined;
  const total = Number(d.total ?? d.Total ?? 0);
  const page = Number(d.page ?? d.Page ?? fallbackPage);
  const pageSize = Number(d.pageSize ?? d.PageSize ?? fallbackPageSize);
  let totalPages = Number(d.totalPages ?? d.TotalPages ?? 0);
  if (!Number.isFinite(totalPages) || totalPages < 0)
    totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;
  return {
    items: Array.isArray(items) ? items : [],
    total: Number.isFinite(total) ? total : 0,
    page: Number.isFinite(page) ? page : fallbackPage,
    pageSize: Number.isFinite(pageSize) ? pageSize : fallbackPageSize,
    totalPages,
  };
}

/** Normalizes listing detail shape (camelCase vs PascalCase) from the API. */
function normalizeListingDetail(raw: unknown): ListingDetailDto {
  const d = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(d.id ?? d.Id ?? ""),
    securityId: String(d.securityId ?? d.SecurityId ?? ""),
    brokerId: String(d.brokerId ?? d.BrokerId ?? ""),
    brokerName: (d.brokerName ?? d.BrokerName ?? null) as string | null,
    brokerInstitution: (d.brokerInstitution ?? d.BrokerInstitution ?? null) as
      | string
      | null,
    instrumentName: String(d.instrumentName ?? d.InstrumentName ?? ""),
    ticker: (d.ticker ?? d.Ticker ?? null) as string | null,
    sector: (d.sector ?? d.Sector ?? null) as string | null,
    price: Number(d.price ?? d.Price ?? 0),
    currency: String(d.currency ?? d.Currency ?? ""),
    securityReferencePrice: (d.securityReferencePrice ??
      d.SecurityReferencePrice ??
      null) as number | null,
    quantity: Number(d.quantity ?? d.Quantity ?? 0),
    minLotSize: (d.minLotSize ?? d.MinLotSize ?? null) as number | null,
    notes: (d.notes ?? d.Notes ?? d.note ?? d.Note ?? null) as string | null,
    status: (d.status ?? d.Status ?? null) as string | null,
    validFrom: (d.validFrom ?? d.ValidFrom ?? null) as string | null,
    validTo: (d.validTo ?? d.ValidTo ?? null) as string | null,
    viewCount: Number(d.viewCount ?? d.ViewCount ?? 0),
    createdAt: String(d.createdAt ?? d.CreatedAt ?? ""),
    updatedAt: String(d.updatedAt ?? d.UpdatedAt ?? ""),
  };
}

export function useModerationQueue(page = 1, pageSize = 50) {
  return useQuery({
    queryKey: listingModerationKeys.queue(page, pageSize),
    queryFn: async () => {
      const { data } = await browserApi.get<unknown>(
        "/v1/market/moderation/queue",
        { params: { page, pageSize } },
      );
      return normalizePagedListings(data, page, pageSize);
    },
  });
}

export function useListingDetail(listingId: string | null) {
  return useQuery({
    queryKey: listingModerationKeys.detail(listingId),
    enabled: Boolean(listingId),
    queryFn: async () => {
      const { data } = await browserApi.get<unknown>(
        `/v1/market/listings/${listingId}`,
      );
      return normalizeListingDetail(data);
    },
  });
}

export function useModerateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listingId,
      body,
    }: {
      listingId: string;
      body: ModerateListingRequestDto;
    }) => {
      await browserApi.post(`/v1/market/moderation/${listingId}`, body);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "market"] });
    },
  });
}
