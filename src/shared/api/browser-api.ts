import axios, { type AxiosError } from "axios";
import { getPublicApiBaseUrl } from "@/shared/config/env";

export const browserApi = axios.create({
  baseURL: getPublicApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

let refreshPromise: Promise<{
  accessToken: string;
  refreshToken: string;
} | null> | null = null;

async function refreshTokens(): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  if (!refreshPromise) {
    refreshPromise = fetch("/api/auth/refresh", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as {
          accessToken: string;
          refreshToken: string;
        };
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export function attachBrowserApiAuth(
  getAccessToken: () => string | undefined,
  onRefreshed: (tokens: {
    accessToken: string;
    refreshToken: string;
  }) => Promise<unknown>,
) {
  const requestId = browserApi.interceptors.request.use((config) => {
    const t = getAccessToken();
    if (t) {
      config.headers.Authorization = `Bearer ${t}`;
    }
    return config;
  });

  const responseId = browserApi.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
      const original = error.config;
      if (!original || (original as { _retry?: boolean })._retry) {
        return Promise.reject(error);
      }
      if (error.response?.status !== 401) {
        return Promise.reject(error);
      }
      (original as { _retry?: boolean })._retry = true;
      const tokens = await refreshTokens();
      if (!tokens) {
        return Promise.reject(error);
      }
      await onRefreshed(tokens);
      original.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return browserApi(original);
    },
  );

  return () => {
    browserApi.interceptors.request.eject(requestId);
    browserApi.interceptors.response.eject(responseId);
  };
}
