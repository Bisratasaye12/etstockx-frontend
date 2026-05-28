import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getPublicApiBaseUrl } from "@/shared/config/env";
import type { TokenPair } from "@/shared/auth/token-pair";
import {
  handleRefreshSessionExpired,
  refreshSessionTokens,
  resetRefreshSessionState,
} from "@/shared/auth/refresh-session";

export const browserApi = axios.create({
  baseURL: getPublicApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

function requestHadAuth(
  config: InternalAxiosRequestConfig,
  getAccessToken: () => string | undefined,
): boolean {
  const header = config.headers?.Authorization;
  if (typeof header === "string" && header.length > 0) return true;
  return Boolean(getAccessToken());
}

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/refresh-token") ||
    url.includes("/auth/register")
  );
}

export function attachBrowserApiAuth(
  getAccessToken: () => string | undefined,
  onRefreshed: (tokens: TokenPair) => Promise<unknown>,
  onRefreshFailed: () => Promise<void>,
) {
  resetRefreshSessionState();

  const requestId = browserApi.interceptors.request.use((config) => {
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    const t = getAccessToken();
    if (t) {
      config.headers.Authorization = `Bearer ${t}`;
    }
    return config;
  });

  const responseId = browserApi.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
      const original = error.config as RetriableConfig | undefined;
      if (!original || original._retry) {
        return Promise.reject(error);
      }
      const status = error.response?.status;
      // Some authorization checks (e.g. activated-user policy) return 403 for stale
      // access-token claims even when refresh token can mint a fresh, valid token.
      // Retry once after refresh for both 401 and 403.
      if (status !== 401 && status !== 403) {
        return Promise.reject(error);
      }
      if (isAuthEndpoint(original.url)) {
        return Promise.reject(error);
      }
      if (!requestHadAuth(original, getAccessToken)) {
        return Promise.reject(error);
      }

      original._retry = true;

      const result = await refreshSessionTokens();

      if (!result.ok) {
        if (result.unauthorized) {
          await handleRefreshSessionExpired(onRefreshFailed);
        }
        return Promise.reject(error);
      }

      await onRefreshed(result.tokens);
      original.headers.Authorization = `Bearer ${result.tokens.accessToken}`;
      return browserApi(original);
    },
  );

  return () => {
    browserApi.interceptors.request.eject(requestId);
    browserApi.interceptors.response.eject(responseId);
  };
}
