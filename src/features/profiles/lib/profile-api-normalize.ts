/**
 * Profiles module validators (FluentValidation) allow only these risk tiers on
 * complete/update — see `CompleteClientProfileCommandValidator` on the backend.
 */
export type ApiRiskProfile = "Conservative" | "Moderate" | "Aggressive";

export function normalizeRiskProfileForApi(raw: string): ApiRiskProfile {
  const v = raw.trim();
  if (v === "Growth") return "Moderate";
  if (v === "Conservative" || v === "Moderate" || v === "Aggressive") {
    return v;
  }
  return "Moderate";
}

/** `CompleteClientProfile` requires non-empty nickname (max 100 chars). */
export function resolveAccountNicknameForComplete(
  rawNickname: string,
  legalName: string,
): string {
  const nick = rawNickname.trim();
  if (nick) return nick.slice(0, 100);
  const first = legalName.trim().split(/\s+/)[0] ?? "";
  const fallback = first ? `${first} · Investor` : "Primary account";
  return fallback.slice(0, 100);
}
