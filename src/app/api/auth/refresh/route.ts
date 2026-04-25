import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getServerApiBaseUrl } from "@/shared/config/env";
import type { TokenRefreshResultDto } from "@/shared/api/dtos/iam";

export async function POST(req: Request) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 },
    );
  }

  const token = await getToken({ req, secret });
  const refreshToken = token?.refreshToken as string | undefined;
  if (!refreshToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiUrl = getServerApiBaseUrl();
  const res = await fetch(`${apiUrl}/api/v1/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const data = (await res.json()) as TokenRefreshResultDto & { error?: string };
  if (!res.ok || !data.accessToken || !data.refreshToken) {
    return NextResponse.json(
      { error: data.error ?? "Refresh failed" },
      { status: 401 },
    );
  }

  return NextResponse.json({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
}
