export const profileKeys = {
  all: ["profiles"] as const,
  clientMe: () => [...profileKeys.all, "client", "me"] as const,
  brokerMe: () => [...profileKeys.all, "broker", "me"] as const,
  adminMe: () => [...profileKeys.all, "admin", "me"] as const,
  avatar: (userId: string, cacheKey = "") =>
    [...profileKeys.all, "avatar", userId, cacheKey] as const,
  watchlist: () => [...profileKeys.all, "watchlist"] as const,
  brokerDirectory: () => [...profileKeys.all, "brokers", "directory"] as const,
};
