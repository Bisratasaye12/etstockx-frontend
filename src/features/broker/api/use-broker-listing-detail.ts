import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { ListingDetailDto } from "@/features/broker/model/listing-detail-types";
import { brokerKeys } from "./keys";

function normalizeListingDetail(raw: unknown): ListingDetailDto {
  const d = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(d.id ?? d.Id ?? ""),
    securityId: String(d.securityId ?? d.SecurityId ?? ""),
    brokerId: String(d.brokerId ?? d.BrokerId ?? ""),
    instrumentName: (d.instrumentName ?? d.InstrumentName ?? null) as
      | string
      | null,
    ticker: (d.ticker ?? d.Ticker ?? null) as string | null,
    sector: (d.sector ?? d.Sector ?? null) as string | null,
    price: Number(d.price ?? d.Price ?? 0),
    currency: (d.currency ?? d.Currency ?? null) as string | null,
    securityReferencePrice: (d.securityReferencePrice ??
      d.SecurityReferencePrice ??
      null) as number | null,
    quantity: Number(d.quantity ?? d.Quantity ?? 0),
    status: (d.status ?? d.Status ?? null) as string | null,
    createdAt: String(d.createdAt ?? d.CreatedAt ?? ""),
    minLotSize: (d.minLotSize ?? d.MinLotSize ?? null) as number | null,
    notes: (d.notes ?? d.Notes ?? d.note ?? d.Note ?? null) as string | null,
    validFrom: (d.validFrom ?? d.ValidFrom ?? null) as string | null,
    validTo: (d.validTo ?? d.ValidTo ?? null) as string | null,
    viewCount: Number(d.viewCount ?? d.ViewCount ?? 0),
    updatedAt: String(d.updatedAt ?? d.UpdatedAt ?? ""),
  };
}

export function useBrokerListingDetail(listingId: string, enabled = true) {
  return useQuery({
    queryKey: brokerKeys.listingDetail(listingId),
    enabled: enabled && listingId.length > 0,
    queryFn: async () => {
      const { data } = await browserApi.get<unknown>(
        `/v1/market/listings/${listingId}`,
      );
      return normalizeListingDetail(data);
    },
  });
}
