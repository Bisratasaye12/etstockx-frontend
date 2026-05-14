/** Maps backend `BuyRequestStatus` / `SellRequestStatus` string names to badge styling. */
export function tradeStatusBadgeClassName(
  status: string | null | undefined,
): string {
  switch (status) {
    case "Filled":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
    case "BrokerReviewing":
    case "ProposalSent":
      return "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100";
    case "TermsAgreed":
    case "ForwardedToESX":
    case "PartiallyFilled":
      return "border-sky-500/25 bg-sky-500/10 text-sky-900 dark:text-sky-100";
    case "Rejected":
    case "Cancelled":
      return "border-destructive/20 bg-destructive/10 text-destructive";
    case "PendingBrokerReview":
    default:
      return "border-border bg-muted/60 text-muted-foreground";
  }
}

export function requestTypeBadgeClassName(kind: "buy" | "sell"): string {
  return kind === "buy"
    ? "border-sky-500/25 bg-sky-500/10 text-sky-900 dark:text-sky-100"
    : "border-destructive/25 bg-destructive/10 text-destructive";
}

/** Birr display aligned with investor “My Requests” mock (`Br 12,450.00`). */
export function formatBirrAmount(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return `Br ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatListingPrice(
  price: number,
  currency: string | null | undefined,
): string {
  const cur = (currency ?? "ETB").trim() || "ETB";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur.length === 3 ? cur : "ETB",
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price.toLocaleString()} ${cur}`;
  }
}

export function formatSectorLabel(
  sector: string | null | undefined,
): string | null {
  const s = sector?.trim();
  if (!s) return null;
  return s.toUpperCase();
}
