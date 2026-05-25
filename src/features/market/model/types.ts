/** OpenAPI `ListingSummaryDto` — browse / search results. */
export interface ListingSummaryDto {
  id: string;
  securityId: string;
  brokerId: string;
  brokerName?: string | null;
  brokerInstitution?: string | null;
  instrumentName: string | null;
  ticker: string | null;
  sector: string | null;
  price: number;
  currency: string | null;
  securityReferencePrice: number | null;
  quantity: number;
  status: string | null;
  createdAt: string;
}

/** OpenAPI `ListingDetailDto`. */
export interface ListingDetailDto {
  id: string;
  securityId: string;
  brokerId: string;
  brokerName?: string | null;
  brokerInstitution?: string | null;
  instrumentName: string | null;
  ticker: string | null;
  sector: string | null;
  price: number;
  currency: string | null;
  securityReferencePrice: number | null;
  quantity: number;
  minLotSize: number | null;
  notes: string | null;
  status: string | null;
  validFrom: string | null;
  validTo: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}
