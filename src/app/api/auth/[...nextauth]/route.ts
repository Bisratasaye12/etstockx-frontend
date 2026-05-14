import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { handlers } from "@/auth";

function wrap(handler: (req: NextRequest, ctx: unknown) => Promise<Response>) {
  return async (req: NextRequest, ctx: unknown) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      console.error("[auth]", err);
      return NextResponse.json(
        {
          message:
            "Auth handler failed. Check AUTH_SECRET / NEXTAUTH_SECRET and Auth callbacks.",
        },
        { status: 500 },
      );
    }
  };
}

export const GET = wrap(
  handlers.GET as (req: NextRequest, ctx: unknown) => Promise<Response>,
);
export const POST = wrap(
  handlers.POST as (req: NextRequest, ctx: unknown) => Promise<Response>,
);
