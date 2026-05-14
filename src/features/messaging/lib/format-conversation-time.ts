/**
 * Compact relative time string used in the conversation list rows. Matches the
 * Figma copy: "now", "5m ago", "2h ago", "Yesterday", "Nov 12", "Nov 12, 2024".
 *
 * The caller passes locale-resolved labels so this helper stays pure and
 * i18n-friendly (English/Amharic come from `broker.messages.time.*`).
 */
export interface ConversationTimeLabels {
  now: string;
  minutesAgo: (n: number) => string;
  hoursAgo: (n: number) => string;
  yesterday: string;
}

export function formatConversationTime(
  iso: string | null | undefined,
  locale: string,
  labels: ConversationTimeLabels,
  now: Date = new Date(),
): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return labels.now;
  if (diffMin < 60) return labels.minutesAgo(diffMin);

  if (isSameCalendarDay(date, now)) {
    const diffHr = Math.floor(diffMin / 60);
    return labels.hoursAgo(diffHr || 1);
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameCalendarDay(date, yesterday)) return labels.yesterday;

  const sameYear = date.getFullYear() === now.getFullYear();
  const intlLocale = locale === "am" ? "am-ET" : "en-US";
  return new Intl.DateTimeFormat(intlLocale, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
