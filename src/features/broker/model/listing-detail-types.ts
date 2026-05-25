import type { Listing } from "@/entities/listing/model/types";

export interface ListingDetailDto extends Listing {
  minLotSize: number | null;
  notes: string | null;
  validFrom: string | null;
  validTo: string | null;
  viewCount: number;
  updatedAt: string;
}

export interface UpdateListingRequestDto {
  price: number | null;
  currency: string | null;
  quantity: number | null;
  minLotSize: number | null;
  notes: string | null;
  validFrom: string | null;
  validTo: string | null;
}

export interface ListingPerformanceDto {
  listingId: string;
  views: number;
  inquiries: number;
  termsAgreed: number;
  conversionRate: number;
  from: string | null;
  to: string | null;
}
