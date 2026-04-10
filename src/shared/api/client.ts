/**
 * Browser API client (TanStack Query / client components).
 * Uses same-origin `/api/backend` rewrites by default; attach auth via `AppProviders`.
 */
export { browserApi, attachBrowserApiAuth } from "./browser-api";
export { getPublicApiBaseUrl, getServerApiBaseUrl } from "@/shared/config/env";
