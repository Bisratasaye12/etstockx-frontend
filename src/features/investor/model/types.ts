/** OpenAPI `BuyRequestDto` — list and detail `request` payload. */
export interface BuyRequestDto {
  id: string;
  clientId?: string;
  brokerId?: string;
  clientName?: string | null;
  brokerName?: string | null;
  brokerInstitution?: string | null;
  listingId?: string | null;
  securityId?: string | null;
  instrumentName: string | null;
  ticker: string | null;
  quantity: number;
  desiredPrice: number | null;
  currency: string | null;
  status: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** OpenAPI `SellRequestDto` — mirrors buy row shape for lists. */
export interface SellRequestDto {
  id: string;
  clientId?: string;
  brokerId?: string;
  clientName?: string | null;
  brokerName?: string | null;
  brokerInstitution?: string | null;
  securityId?: string | null;
  instrumentName: string | null;
  ticker: string | null;
  quantity: number;
  desiredPrice: number | null;
  currency: string | null;
  status: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TradeProposalDto {
  id: string;
  requestId: string;
  requestType: string | null;
  proposedBy: string;
  proposedQuantity: number | null;
  proposedPrice: number | null;
  notes: string | null;
  status: string | null;
  createdAt: string;
  respondedAt: string | null;
}

export interface OrderHistoryEntryDto {
  id: string;
  requestId: string;
  requestType: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  changedBy: string;
  filledQuantity: number | null;
  actualPrice: number | null;
  notes: string | null;
  occurredAt: string;
}

export interface BuyRequestDetailDto {
  request: BuyRequestDto;
  proposals: TradeProposalDto[] | null;
  history: OrderHistoryEntryDto[] | null;
}

export interface SellRequestDetailDto {
  request: SellRequestDto;
  proposals: TradeProposalDto[] | null;
  history: OrderHistoryEntryDto[] | null;
}

export type InvestorRequestRowKind = "buy" | "sell";

export interface InvestorRequestRow {
  id: string;
  kind: InvestorRequestRowKind;
  instrumentName: string | null;
  ticker: string | null;
  status: string | null;
  createdAt: string;
}
