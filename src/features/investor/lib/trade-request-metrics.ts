/** Backend serializes `enum.ToString()` — PascalCase names. */
const TERMINAL = new Set(["Filled", "Rejected", "Cancelled"]);

const IN_NEGOTIATION = new Set(["BrokerReviewing", "ProposalSent"]);

export function isTerminalTradeStatus(
  status: string | null | undefined,
): boolean {
  if (!status) return false;
  return TERMINAL.has(status);
}

export function countActiveRequests(
  statuses: Array<string | null | undefined>,
): number {
  return statuses.filter((s) => s && !TERMINAL.has(s)).length;
}

export function countInNegotiation(
  statuses: Array<string | null | undefined>,
): number {
  return statuses.filter((s) => s && IN_NEGOTIATION.has(s)).length;
}

export function countTermsAgreed(
  statuses: Array<string | null | undefined>,
): number {
  return statuses.filter((s) => s === "TermsAgreed").length;
}

export function countCompleted(
  statuses: Array<string | null | undefined>,
): number {
  return statuses.filter((s) => s === "Filled").length;
}
