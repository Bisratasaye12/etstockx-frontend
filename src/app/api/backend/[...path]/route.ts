import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerApiBaseUrl } from "@/shared/config/env";

export const dynamic = "force-dynamic";

const hopByHop = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "te",
  "trailer",
  "upgrade",
  "host",
  "content-length",
  "proxy-authenticate",
  "proxy-authorization",
]);

/** Do not forward to the API origin (same-origin fetches send site cookies; API auth is Bearer). */
const stripFromUpstreamRequest = new Set(["cookie"]);

function buildUpstreamHeaders(req: NextRequest): Headers {
  const out = new Headers();
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (hopByHop.has(k) || stripFromUpstreamRequest.has(k)) return;
    out.set(key, value);
  });
  return out;
}

function filterResponseHeaders(upstream: Response): Headers {
  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (hopByHop.has(k)) return;
    out.set(key, value);
  });
  return out;
}

async function proxy(
  req: NextRequest,
  pathSegments: string[],
): Promise<Response> {
  try {
    const origin = getServerApiBaseUrl();
    const suffix = pathSegments.length > 0 ? pathSegments.join("/") : "";
    const upstreamUrl = new URL(suffix ? `/api/${suffix}` : "/api", origin);
    upstreamUrl.search = req.nextUrl.search;

    const headers = buildUpstreamHeaders(req);
    const method = req.method.toUpperCase();

    const init: RequestInit = {
      method,
      headers,
      redirect: "follow",
    };

    if (method !== "GET" && method !== "HEAD") {
      init.body = req.body;
      (init as { duplex?: "half" }).duplex = "half";
    }

    const upstream = await fetch(upstreamUrl, init);

    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: filterResponseHeaders(upstream),
    });
  } catch (err) {
    console.error("[api/backend proxy]", err);
    return NextResponse.json(
      {
        error: `Upstream API unreachable (${getServerApiBaseUrl()}). Is the backend running?`,
      },
      { status: 502 },
    );
  }
}

type RouteCtx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function OPTIONS(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
