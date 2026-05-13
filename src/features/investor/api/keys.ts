export const investorKeys = {
  all: ["investor"] as const,
  buyRequestStats: () =>
    [...investorKeys.all, "buy-requests", "stats"] as const,
  sellRequestStats: () =>
    [...investorKeys.all, "sell-requests", "stats"] as const,
  /** Larger slice for dashboard metrics (active / negotiation / etc.). */
  tradeSnapshotBuy: () =>
    [...investorKeys.all, "buy-requests", "dashboard-snapshot"] as const,
  tradeSnapshotSell: () =>
    [...investorKeys.all, "sell-requests", "dashboard-snapshot"] as const,
  recentBuyRequests: () =>
    [...investorKeys.all, "buy-requests", "recent"] as const,
  recentSellRequests: () =>
    [...investorKeys.all, "sell-requests", "recent"] as const,
  conversationsUnread: () =>
    [...investorKeys.all, "messages", "unread"] as const,
  /** My Requests page — buy + sell list slices (filters baked into key). */
  myRequestsBuy: (signature: string) =>
    [...investorKeys.all, "my-requests", "buy", signature] as const,
  myRequestsSell: (signature: string) =>
    [...investorKeys.all, "my-requests", "sell", signature] as const,
  buyRequestDetail: (id: string) =>
    [...investorKeys.all, "buy-requests", "detail", id] as const,
  sellRequestDetail: (id: string) =>
    [...investorKeys.all, "sell-requests", "detail", id] as const,
};
