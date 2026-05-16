import { encode, type JWT } from "@auth/core/jwt";
import type { NextResponse } from "next/server";
import { resolveAuthSecret } from "@/shared/auth/resolve-auth-secret";

/** Matches `session.maxAge` in `src/auth.ts`. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function resolveSecureSessionCookie(req: Request): boolean {
  if (process.env.NODE_ENV === "production") return true;
  try {
    const url = new URL(req.url);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function sessionCookieName(secure: boolean): string {
  return secure ? "__Secure-authjs.session-token" : "authjs.session-token";
}

export async function applySessionTokenCookie(
  response: NextResponse,
  req: Request,
  token: JWT,
): Promise<void> {
  const secure = resolveSecureSessionCookie(req);
  const name = sessionCookieName(secure);
  const secret = resolveAuthSecret();

  const value = await encode({
    token,
    secret,
    salt: name,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  response.cookies.set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}
