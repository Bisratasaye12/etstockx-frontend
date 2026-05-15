import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { auth } from "@/auth";
import { routing } from "@/shared/i18n/routing";
import {
  isAdminRole,
  isBrokerPortalRole,
  isClientRole,
  isSuperAdminRole,
} from "@/shared/lib/user-role";

const intlMiddleware = createIntlMiddleware(routing);

function getLocaleFromPath(pathname: string): "en" | "am" {
  return pathname.startsWith("/am") ? "am" : "en";
}

function isPublicPath(pathname: string): boolean {
  if (/^\/(en|am)$/.test(pathname)) return true;
  return /^\/(en|am)\/(login|register|verify-email|confirm-email|forgot-password|reset-password|market|brokers)(\/|$)/.test(
    pathname,
  );
}

function isProtectedPath(pathname: string): boolean {
  return /^\/(en|am)\/(dashboard|profile|admin|requests|messages|watchlist)(\/|$)/.test(
    pathname,
  );
}

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const locale = getLocaleFromPath(path);

  if (
    path.startsWith("/api") ||
    path.startsWith("/_next") ||
    path === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/.test(path.split("/").pop() ?? "")
  ) {
    return NextResponse.next();
  }

  if (isProtectedPath(path) && !req.auth) {
    const url = new URL(`/${locale}/login`, req.nextUrl.origin);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  if (/^\/(en|am)\/admin/.test(path) && !isAdminRole(req.auth?.user?.role)) {
    return NextResponse.redirect(
      new URL(`/${locale}/dashboard`, req.nextUrl.origin),
    );
  }

  if (
    /^\/(en|am)\/profile\/admin/.test(path) &&
    !isAdminRole(req.auth?.user?.role)
  ) {
    return NextResponse.redirect(
      new URL(`/${locale}/dashboard`, req.nextUrl.origin),
    );
  }

  if (
    /^\/(en|am)\/admin\/users(\/|$)/.test(path) &&
    !isSuperAdminRole(req.auth?.user?.rawRole ?? req.auth?.user?.role)
  ) {
    return NextResponse.redirect(
      new URL(`/${locale}/admin/overview`, req.nextUrl.origin),
    );
  }

  if (
    /^\/(en|am)\/profile\/broker/.test(path) &&
    !isBrokerPortalRole(req.auth?.user?.role)
  ) {
    return NextResponse.redirect(
      new URL(`/${locale}/dashboard`, req.nextUrl.origin),
    );
  }

  if (
    /^\/(en|am)\/dashboard\/broker/.test(path) &&
    !isBrokerPortalRole(req.auth?.user?.role)
  ) {
    return NextResponse.redirect(
      new URL(`/${locale}/dashboard`, req.nextUrl.origin),
    );
  }

  if (
    /^\/(en|am)\/profile\/client/.test(path) &&
    !isClientRole(req.auth?.user?.role)
  ) {
    return NextResponse.redirect(
      new URL(`/${locale}/dashboard`, req.nextUrl.origin),
    );
  }

  if (!isPublicPath(path) && !isProtectedPath(path) && !req.auth) {
    // e.g. unknown localized path — still run intl
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
