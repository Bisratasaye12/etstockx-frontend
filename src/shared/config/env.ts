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

/**
 * Browser: backend origin for SignalR hubs (WebSockets). REST can stay on
 * `/api/backend` via `NEXT_PUBLIC_API_URL`; set this to the same host as `API_URL`.
 */
export function getPublicBackendOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.trim();
  if (!raw) return null;

  try {
    const url = raw.startsWith("http") ? raw : `http://${raw}`;
    return new URL(normalizeServerApiOrigin(url)).origin;
  } catch {
    return null;
  }
}

const NOTIFICATIONS_HUB_PATH = "/hubs/notifications";

/** Absolute SignalR hub URL, or null when backend origin is not configured. */
export function getNotificationsHubUrl(): string | null {
  const fromEnv = getPublicBackendOrigin();
  if (fromEnv) return `${fromEnv}${NOTIFICATIONS_HUB_PATH}`;

  const apiBase = getPublicApiBaseUrl();
  if (apiBase.startsWith("http://") || apiBase.startsWith("https://")) {
    try {
      return `${new URL(apiBase).origin}${NOTIFICATIONS_HUB_PATH}`;
    } catch {
      return null;
    }
  }

  return null;
}
