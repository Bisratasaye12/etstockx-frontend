import type { IncomingRequestDto } from "@/features/broker/model/types";

function normalizeStatus(status: string | null | undefined) {
  return (status ?? "").toLowerCase().replace(/\s+/g, "");
}

/**
 * Row-level counts for the current result slice (e.g. one API page).
 * Totals may differ from the full filtered dataset when the API returns multiple pages.
 */
export function summarizeClientTradeRows(items: IncomingRequestDto[] | null) {
  const list = items ?? [];
  let buy = 0;
  let sell = 0;
  let filled = 0;
  let rejected = 0;

  for (const row of list) {
    const k = (row.kind ?? "").toLowerCase();
    if (k.includes("sell")) sell += 1;
    else buy += 1;

    const s = normalizeStatus(row.status);
    if (s.includes("filled") || s.includes("partiallyfilled")) filled += 1;
    if (s.includes("reject")) rejected += 1;
  }

  return { buy, sell, filled, rejected, rowCount: list.length };
}
