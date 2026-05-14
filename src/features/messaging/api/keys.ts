/**
 * Query keys for the Messaging feature. Keep narrow and consistent with
 * `features/notifications/api/keys.ts` so cross-feature invalidation reads
 * obvious at the call site.
 */
export const messagingKeys = {
  all: ["messaging"] as const,
  conversations: (params: { page: number; pageSize: number }) =>
    [...messagingKeys.all, "conversations", params] as const,
  unreadTotal: () => [...messagingKeys.all, "unread-total"] as const,
  thread: (conversationId: string, pageSize: number) =>
    [...messagingKeys.all, "thread", conversationId, pageSize] as const,
  threadAll: (conversationId: string) =>
    [...messagingKeys.all, "thread", conversationId] as const,
  search: (conversationId: string, keyword: string, limit: number) =>
    [
      ...messagingKeys.all,
      "thread-search",
      conversationId,
      keyword,
      limit,
    ] as const,
};
