import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getServerApiBaseUrl } from "@/shared/config/env";
import { resolveAuthSecret } from "@/shared/auth/resolve-auth-secret";
import type {
  LogoutRequestDto,
  TokenRefreshResultDto,
} from "@/shared/api/dtos/iam";

async function refreshAccessToken(
  apiUrl: string,
  refreshToken: string,
): Promise<string | null> {
  const res = await fetch(`${apiUrl}/api/v1/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as TokenRefreshResultDto & { error?: string };
  return data.accessToken ?? null;
}

async function revokeBackendSession(
  apiUrl: string,
  accessToken: string,
  body: LogoutRequestDto,
): Promise<Response> {
  return fetch(`${apiUrl}/api/v1/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function POST(req: Request) {
  const token = await getToken({ req, secret: resolveAuthSecret() });
  const refreshToken = token?.refreshToken as string | undefined;
  let accessToken = token?.accessToken as string | undefined;

  if (!refreshToken && !accessToken) {
    return new NextResponse(null, { status: 204 });
  }

  const apiUrl = getServerApiBaseUrl();
  const body: LogoutRequestDto = refreshToken
    ? { refreshToken, revokeAll: false }
    : { revokeAll: true };

  if (!accessToken && refreshToken) {
    accessToken = (await refreshAccessToken(apiUrl, refreshToken)) ?? undefined;
  }

  if (accessToken) {
    let res = await revokeBackendSession(apiUrl, accessToken, body);
    if (res.status === 401 && refreshToken) {
      const refreshedAccessToken = await refreshAccessToken(
        apiUrl,
        refreshToken,
      );
      if (refreshedAccessToken) {
        res = await revokeBackendSession(apiUrl, refreshedAccessToken, body);
      }
    }
  }

  return new NextResponse(null, { status: 204 });
}
