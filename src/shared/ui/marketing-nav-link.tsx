"use client";

import { Link, usePathname } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";

type MarketingNavLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Path-based active state for marketing nav (Listings, Brokers).
 */
export function MarketingNavLink({
  href,
  children,
  className,
}: MarketingNavLinkProps) {
  const pathname = usePathname();
  const active =
    href === "/market"
      ? pathname.startsWith("/market")
      : href === "/brokers"
        ? pathname.startsWith("/brokers")
        : false;

  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium transition-colors",
        active
          ? "text-primary border-primary border-b-2 pb-0.5"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {children}
    </Link>
  );
}
