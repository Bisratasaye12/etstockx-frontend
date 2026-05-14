import type { MessageDto } from "@/entities/messaging/model/types";

export type MessageDayGroupKey = "today" | "yesterday" | "date";

export type MessageDayGroup = {
  /** Stable react key + i18n discriminator. */
  key: string;
  /** Tells the caller which label to render. */
  kind: MessageDayGroupKey;
  /** ISO date (yyyy-mm-dd) of the calendar day — provided for `kind="date"`. */
  iso: string;
  items: MessageDto[];
};

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Groups thread messages by calendar day for the "Today" / "Yesterday" /
 * "Apr 12" separator pills in the Figma. Input is assumed chronological
 * (oldest → newest); the caller flips the backend's newest-first paging.
 */
export function groupMessagesByDay(
  messages: MessageDto[],
  now: Date = new Date(),
): MessageDayGroup[] {
  const todayStart = startOfDay(now);
  const yesterdayStart = todayStart - 86_400_000;

  const groups = new Map<string, MessageDayGroup>();

  for (const m of messages) {
    const date = new Date(m.sentAt);
    if (Number.isNaN(date.getTime())) continue;

    const ds = startOfDay(date);
    let kind: MessageDayGroupKey;
    if (ds === todayStart) kind = "today";
    else if (ds === yesterdayStart) kind = "yesterday";
    else kind = "date";

    const iso = isoDate(date);
    const key = kind === "date" ? iso : kind;

    const existing = groups.get(key);
    if (existing) {
      existing.items.push(m);
    } else {
      groups.set(key, { key, kind, iso, items: [m] });
    }
  }

  return Array.from(groups.values());
}
