import { getPublicApiBaseUrl } from "@/shared/config/env";

/** Resolves a profile image URL or storage path to an absolute URL for display. */
export function resolveProfileMediaUrl(
  pathOrUrl: string | null | undefined,
): string | null {
  const raw = pathOrUrl?.trim();
  if (!raw) return null;

  const u = raw.replace(/\\/g, "/");
  if (u.startsWith("http://") || u.startsWith("https://")) return u;

  const base = getPublicApiBaseUrl().replace(/\/$/, "");
  if (!base) return null;

  if (u.startsWith("/")) return `${base}${u}`;
  return `${base}/${u}`;
}

/** True when the resolved URL points at this app's API (needs Bearer, not plain img src). */
export function isApiHostedMediaUrl(url: string): boolean {
  if (url.includes("/v1/profiles/") || url.includes("/profiles/")) {
    const base = getPublicApiBaseUrl().replace(/\/$/, "");
    if (!base || base.startsWith("/")) return true;
    return url.startsWith(base);
  }
  return false;
}
