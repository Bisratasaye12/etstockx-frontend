const storageKey = (userId: string) => `etstockx-broker-mfa:${userId}`;

/**
 * Best-effort UI hint: the API does not expose MFA status on profile.
 * Synced when the user completes setup, disables MFA, or hits "already enabled".
 */
export function readBrokerMfaPreference(
  userId: string | undefined,
): boolean | null {
  if (!userId || typeof window === "undefined") return null;
  const raw = localStorage.getItem(storageKey(userId));
  if (raw === "1") return true;
  if (raw === "0") return false;
  return null;
}

export function writeBrokerMfaPreference(userId: string, enabled: boolean) {
  localStorage.setItem(storageKey(userId), enabled ? "1" : "0");
}
