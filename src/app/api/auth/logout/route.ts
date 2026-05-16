import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getServerApiBaseUrl } from "@/shared/config/env";
import { resolveAuthSecret } from "@/shared/auth/resolve-auth-secret";
import { resolveSecureSessionCookie } from "@/shared/auth/session-cookie";
import { refreshTokenPairWithBackend } from "@/shared/auth/token-pair";

type LogoutRequestDto = {
  refreshToken?: string;
  revokeAll?: boolean;
};

async function refreshAccessToken(
  apiUrl: string,
  refreshToken: string,
): Promise<string | null> {
  const result = await refreshTokenPairWithBackend(apiUrl, refreshToken);
  return result.ok ? result.tokens.accessToken : null;
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
  const secret = resolveAuthSecret();
  const secure = resolveSecureSessionCookie(req);
  const token = await getToken({ req, secret, secureCookie: secure });
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
    const res = await revokeBackendSession(apiUrl, accessToken, body);
    if (res.status === 401 && refreshToken) {
      const refreshed = await refreshTokenPairWithBackend(apiUrl, refreshToken);
      if (refreshed.ok) {
        await revokeBackendSession(apiUrl, refreshed.tokens.accessToken, {
          refreshToken: refreshed.tokens.refreshToken,
          revokeAll: false,
        });
      }
    }
  }

  const response = new NextResponse(null, { status: 204 });
  const cookieName = secure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
  response.cookies.delete(cookieName);
  return response;
}
