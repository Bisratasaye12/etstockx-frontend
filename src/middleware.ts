import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { auth } from "@/auth";
import { routing } from "@/shared/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

function isPublicPath(pathname: string): boolean {
  if (/^\/(en|am)$/.test(pathname)) return true;
  return /^\/(en|am)\/(login|register|verify-email|forgot-password|market|brokers)(\/|$)/.test(
    pathname,
  );
}

function isProtectedPath(pathname: string): boolean {
  return /^\/(en|am)\/(dashboard|profile|admin)(\/|$)/.test(pathname);
}

export default auth((req) => {
  const path = req.nextUrl.pathname;

  if (
    path.startsWith("/api") ||
    path.startsWith("/_next") ||
    path === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/.test(path.split("/").pop() ?? "")
  ) {
    return NextResponse.next();
  }

  if (isProtectedPath(path) && !req.auth) {
    const url = new URL("/en/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  if (/^\/(en|am)\/admin/.test(path) && req.auth?.user?.role !== "Admin") {
    return NextResponse.redirect(new URL("/en/dashboard", req.nextUrl.origin));
  }

  if (
    /^\/(en|am)\/profile\/broker/.test(path) &&
    req.auth?.user?.role !== "Broker" &&
    req.auth?.user?.role !== "Dealer"
  ) {
    return NextResponse.redirect(new URL("/en/dashboard", req.nextUrl.origin));
  }

  if (
    /^\/(en|am)\/profile\/client/.test(path) &&
    req.auth?.user?.role !== "Client"
  ) {
    return NextResponse.redirect(new URL("/en/dashboard", req.nextUrl.origin));
  }

  if (!isPublicPath(path) && !isProtectedPath(path) && !req.auth) {
    // e.g. unknown localized path — still run intl
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
