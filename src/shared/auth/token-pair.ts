export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

/** Accepts camelCase or PascalCase IAM token JSON. */
export function normalizeTokenPair(data: unknown): TokenPair | null {
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  const accessToken =
    pickString(record, "accessToken") ?? pickString(record, "AccessToken");
  const refreshToken =
    pickString(record, "refreshToken") ?? pickString(record, "RefreshToken");

  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

function pickString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function refreshTokenPairWithBackend(
  apiUrl: string,
  refreshToken: string,
): Promise<{ ok: true; tokens: TokenPair } | { ok: false; error?: string }> {
  const res = await fetch(`${apiUrl}/api/v1/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  const tokens = normalizeTokenPair(payload);
  const error =
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "string"
      ? (payload as { error: string }).error
      : undefined;

  if (!res.ok || !tokens) {
    return { ok: false, error: error ?? "Refresh failed" };
  }

  return { ok: true, tokens };
}
