import type { NotificationItem } from "@/entities/notification/model/types";

export type DayGroupKey = "today" | "yesterday" | "earlier";

export function groupNotificationsByCalendarDay(
  items: NotificationItem[],
  now: Date = new Date(),
): { key: DayGroupKey; items: NotificationItem[] }[] {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const today: NotificationItem[] = [];
  const yesterday: NotificationItem[] = [];
  const earlier: NotificationItem[] = [];

  for (const n of items) {
    const d = new Date(n.sentAt);
    if (d >= startOfToday) today.push(n);
    else if (d >= startOfYesterday) yesterday.push(n);
    else earlier.push(n);
  }

  const out: { key: DayGroupKey; items: NotificationItem[] }[] = [];
  if (today.length) out.push({ key: "today", items: today });
  if (yesterday.length) out.push({ key: "yesterday", items: yesterday });
  if (earlier.length) out.push({ key: "earlier", items: earlier });
  return out;
}
