/**
 * Browser: same-origin proxy `/api/backend` (Route Handler `src/app/api/backend/[...path]/route.ts`), unless
 * `NEXT_PUBLIC_API_URL` points at the API directly (then `/api` is appended when missing).
 * Server (NextAuth, Route Handlers): origin only, e.g. `http://localhost:8080` — callers add `/api/v1/...`.
 */
export function getPublicApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return "/api/backend";

  if (raw.startsWith("/")) {
    const path = raw.replace(/\/$/, "");
    return path.length > 0 ? path : "/api/backend";
  }

  let base = raw.replace(/\/$/, "");
  if (base.startsWith("http://") || base.startsWith("https://")) {
    if (!base.endsWith("/api")) {
      base = `${base}/api`;
    }
  }
  return base;
}

function normalizeServerApiOrigin(url: string): string {
  let u = url.trim().replace(/\/$/, "");
  if (u.endsWith("/api")) {
    u = u.slice(0, -4).replace(/\/$/, "");
  }
  return u;
}

export function getServerApiBaseUrl(): string {
  return normalizeServerApiOrigin(
    process.env.API_URL ?? "http://localhost:8080",
  );
}
