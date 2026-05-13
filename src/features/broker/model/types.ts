export interface BrokerOrderSummaryDto {
  pendingReview: number;
  inNegotiation: number;
  termsAgreed: number;
  forwardedToESX: number;
  filledToday: number;
  rejectedToday: number;
  totalOpenRequests: number;
}

export interface IncomingRequestDto {
  id: string;
  kind: string | null;
  clientId: string;
  instrumentName: string | null;
  ticker: string | null;
  quantity: number;
  desiredPrice: number | null;
  currency: string | null;
  status: string | null;
  createdAt: string;
}

export interface IncomingRequestDtoPagedResult {
  items: IncomingRequestDto[] | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BrokerRequestDto {
  id: string;
  clientId: string;
  brokerId: string;
  listingId?: string | null;
  instrumentName: string | null;
  ticker: string | null;
  quantity: number;
  desiredPrice: number | null;
  currency: string | null;
  status: string | null;
  notes: string | null;
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

export interface BrokerRequestDetailDto {
  request: BrokerRequestDto;
  proposals: TradeProposalDto[] | null;
  history: OrderHistoryEntryDto[] | null;
}
