import { normalizeTokenPair, type TokenPair } from "@/shared/auth/token-pair";

export type RefreshSessionResult =
  | { ok: true; tokens: TokenPair }
  | { ok: false; unauthorized: boolean };

let refreshInFlight: Promise<RefreshSessionResult> | null = null;
let sessionExpiryHandled = false;

/** Queues concurrent callers behind a single POST /api/auth/refresh. */
export function refreshSessionTokens(): Promise<RefreshSessionResult> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export function isRefreshSessionInFlight(): boolean {
  return refreshInFlight !== null;
}

/** Runs once per tab when refresh returns 401 (invalid/expired refresh token). */
export async function handleRefreshSessionExpired(
  onExpired: () => Promise<void>,
): Promise<void> {
  if (sessionExpiryHandled) return;
  sessionExpiryHandled = true;
  await onExpired();
}

export function resetRefreshSessionState(): void {
  sessionExpiryHandled = false;
}

async function performRefresh(): Promise<RefreshSessionResult> {
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });

  if (res.status === 401) {
    return { ok: false, unauthorized: true };
  }

  if (!res.ok) {
    return { ok: false, unauthorized: false };
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    return { ok: false, unauthorized: false };
  }

  const tokens = normalizeTokenPair(payload);
  if (!tokens) {
    return { ok: false, unauthorized: false };
  }

  return { ok: true, tokens };
}
