import { browserApi } from "@/shared/api/browser-api";

type Paged<T> = {
  items: T[] | null;
  total: number;
};

type ConversationRow = { unreadCount: number };

export async function fetchInvestorUnreadMessageCount(): Promise<number> {
  const { data } = await browserApi.get<Paged<ConversationRow>>(
    "/v1/messages/conversations",
    { params: { page: 1, pageSize: 100 } },
  );
  const items = data.items ?? [];
  return items.reduce((acc, c) => acc + (c.unreadCount ?? 0), 0);
}
