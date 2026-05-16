import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getServerApiBaseUrl } from "@/shared/config/env";
import { resolveAuthSecret } from "@/shared/auth/resolve-auth-secret";
import {
  applySessionTokenCookie,
  resolveSecureSessionCookie,
} from "@/shared/auth/session-cookie";
import { refreshTokenPairWithBackend } from "@/shared/auth/token-pair";

export async function POST(req: Request) {
  const secret = resolveAuthSecret();
  const secure = resolveSecureSessionCookie(req);

  const token = await getToken({
    req,
    secret,
    secureCookie: secure,
  });

  const refreshToken =
    typeof token?.refreshToken === "string" ? token.refreshToken : undefined;

  if (!refreshToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiUrl = getServerApiBaseUrl();
  const refreshed = await refreshTokenPairWithBackend(apiUrl, refreshToken);

  if (!refreshed.ok) {
    return NextResponse.json(
      { error: refreshed.error ?? "Refresh failed" },
      { status: 401 },
    );
  }

  const response = NextResponse.json(refreshed.tokens);

  await applySessionTokenCookie(response, req, {
    ...token,
    accessToken: refreshed.tokens.accessToken,
    refreshToken: refreshed.tokens.refreshToken,
  });

  return response;
}
