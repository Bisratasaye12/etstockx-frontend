/** Calendar-day comparison in the user's local timezone. */
function startOfLocalDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export type TradeRequestDateParts =
  | { mode: "today"; at: Date }
  | { mode: "yesterday" }
  | { mode: "other"; at: Date };

export function getTradeRequestDateParts(
  iso: string,
  now = new Date(),
): TradeRequestDateParts {
  const at = new Date(iso);
  const d0 = startOfLocalDay(at);
  const n0 = startOfLocalDay(now);
  const diffDays = Math.round((n0 - d0) / 86_400_000);
  if (diffDays === 0) return { mode: "today", at };
  if (diffDays === 1) return { mode: "yesterday" };
  return { mode: "other", at };
}

export function formatTradeRequestTime(at: Date): string {
  return at.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTradeRequestCalendarDate(at: Date): string {
  return at.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
