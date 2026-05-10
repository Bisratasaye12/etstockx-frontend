export const investorKeys = {
  all: ["investor"] as const,
  buyRequestStats: () =>
    [...investorKeys.all, "buy-requests", "stats"] as const,
  sellRequestStats: () =>
    [...investorKeys.all, "sell-requests", "stats"] as const,
  recentBuyRequests: () =>
    [...investorKeys.all, "buy-requests", "recent"] as const,
  conversationsUnread: () =>
    [...investorKeys.all, "messages", "unread"] as const,
};
