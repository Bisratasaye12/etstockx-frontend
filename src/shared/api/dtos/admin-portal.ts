/**
 * Admin portal API contracts — Market moderation + Admin audit logs.
 * Routes: `api/v1/market/*`, `api/v1/admin/*` (proxied as `/api/backend/v1/...`).
 */

export interface ListingSummaryDto {
  id: string;
  securityId: string;
  brokerId: string;
  brokerName: string | null;
  brokerInstitution: string | null;
  instrumentName: string;
  ticker: string | null;
  sector: string | null;
  price: number;
  currency: string;
  securityReferencePrice: number | null;
  quantity: number;
  status: string | null;
  createdAt: string;
}

export interface ListingDetailDto {
  id: string;
  securityId: string;
  brokerId: string;
  brokerName: string | null;
  brokerInstitution: string | null;
  instrumentName: string;
  ticker: string | null;
  sector: string | null;
  price: number;
  currency: string;
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

export interface PagedResult<T> {
  items: T[] | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** POST /market/moderation/{id} — Swagger uses integer enum. */
export const ModerationDecision = {
  Approved: 0,
  Rejected: 1,
  Hidden: 2,
  Clarification: 3,
} as const;

export type ModerationDecisionCode =
  (typeof ModerationDecision)[keyof typeof ModerationDecision];

export interface ModerateListingRequestDto {
  decision: ModerationDecisionCode;
  reason: string | null;
}

export interface AuditLogDto {
  id: string;
  actorId: string | null;
  actionType: string;
  entityType: string | null;
  entityId: string | null;
  oldValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
  sessionId: string | null;
  occurredAt: string;
}
