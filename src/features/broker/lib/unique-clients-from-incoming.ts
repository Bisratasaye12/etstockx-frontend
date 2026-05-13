import type { BrokerClientListRow } from "@/entities/broker/model/types";
import type { IncomingRequestDto } from "@/features/broker/model/types";

export function uniqueClientsFromIncoming(
  items: IncomingRequestDto[] | null,
): BrokerClientListRow[] {
  const map = new Map<string, BrokerClientListRow>();
  for (const row of items ?? []) {
    const id = row.clientId;
    if (!id) continue;
    const name =
      row.clientName?.trim() || `Client ${id.replace(/-/g, "").slice(0, 8)}`;
    const existing = map.get(id);
    if (!existing) {
      map.set(id, {
        clientId: id,
        displayName: name,
        lastRequestAt: row.createdAt,
      });
    } else if (
      new Date(row.createdAt).getTime() >
      new Date(existing.lastRequestAt).getTime()
    ) {
      existing.lastRequestAt = row.createdAt;
      if (row.clientName?.trim()) {
        existing.displayName = row.clientName.trim();
      }
    }
  }
  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.lastRequestAt).getTime() - new Date(a.lastRequestAt).getTime(),
  );
}
