/** Matches backend `BuyRequestStatus` / `SellRequestStatus` names (PascalCase). */
export type TradeRequestStatusName =
  | "PendingBrokerReview"
  | "BrokerReviewing"
  | "ProposalSent"
  | "TermsAgreed"
  | "ForwardedToESX"
  | "PartiallyFilled"
  | "Filled"
  | "Rejected"
  | "Cancelled";

const BUY_INT: Record<TradeRequestStatusName, number> = {
  PendingBrokerReview: 0,
  BrokerReviewing: 1,
  ProposalSent: 2,
  TermsAgreed: 3,
  ForwardedToESX: 4,
  PartiallyFilled: 5,
  Filled: 6,
  Rejected: 7,
  Cancelled: 8,
};

const SELL_INT: Record<
  Exclude<TradeRequestStatusName, "PartiallyFilled">,
  number
> = {
  PendingBrokerReview: 0,
  BrokerReviewing: 1,
  ProposalSent: 2,
  TermsAgreed: 3,
  ForwardedToESX: 4,
  Filled: 5,
  Rejected: 6,
  Cancelled: 7,
};

export const TRADE_REQUEST_STATUS_ORDER: TradeRequestStatusName[] = [
  "PendingBrokerReview",
  "BrokerReviewing",
  "ProposalSent",
  "TermsAgreed",
  "ForwardedToESX",
  "PartiallyFilled",
  "Filled",
  "Rejected",
  "Cancelled",
];

export function statusFilterOptionsForTab(
  tab: "all" | "buy" | "sell",
): TradeRequestStatusName[] {
  if (tab === "sell") {
    return TRADE_REQUEST_STATUS_ORDER.filter((s) => s !== "PartiallyFilled");
  }
  return TRADE_REQUEST_STATUS_ORDER;
}

export function buyStatusQueryValue(
  status: TradeRequestStatusName | "",
): number | undefined {
  if (!status) return undefined;
  return BUY_INT[status];
}

export function sellStatusQueryValue(
  status: TradeRequestStatusName | "",
): number | undefined {
  if (!status) return undefined;
  if (status === "PartiallyFilled") return undefined;
  return SELL_INT[status];
}
