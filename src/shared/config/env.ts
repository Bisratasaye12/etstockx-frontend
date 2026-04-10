/**
 * Browser: same-origin proxy `/api/backend` (see next.config rewrites).
 * Server (NextAuth, Route Handlers): direct API URL.
 */
export function getPublicApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "/api/backend";
}

export function getServerApiBaseUrl(): string {
  return process.env.API_URL ?? "http://localhost:5163";
}
