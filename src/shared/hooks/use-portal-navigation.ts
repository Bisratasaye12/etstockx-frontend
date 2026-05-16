"use client";

import { useEffect, useState } from "react";
import { usePathname } from "@/shared/i18n/routing";

export function usePortalNavigation(
  isActiveFn: (pathname: string, href: string) => boolean,
) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const isNavigating =
    pendingHref !== null && !isActiveFn(pathname, pendingHref);

  const beginNavigation = (href: string) => setPendingHref(href);

  const isItemActive = (href: string) =>
    isNavigating ? pendingHref === href : isActiveFn(pathname, href);

  return {
    pathname,
    pendingHref,
    isNavigating,
    beginNavigation,
    isItemActive,
  };
}
