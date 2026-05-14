import { browserApi } from "@/shared/api/browser-api";
import type { ConversationPagedResult } from "@/entities/messaging/model/types";

/**
 * Sums `unreadCount` across the current user's first page of conversations.
 *
 * The Messaging API does not yet expose a dedicated unread-total endpoint, so
 * we approximate by aggregating the paged conversation list (mirrors the
 * client-side investor unread badge). When the backend adds a direct counter,
 * swap the implementation here without changing call sites.
 */
export async function fetchUnreadMessageCount(): Promise<number> {
  const { data } = await browserApi.get<ConversationPagedResult>(
    "/v1/messages/conversations",
    { params: { page: 1, pageSize: 100 } },
  );
  const items = data.items ?? [];
  return items.reduce((acc, c) => acc + (c.unreadCount ?? 0), 0);
}
