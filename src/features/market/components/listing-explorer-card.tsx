"use client";

import { Bookmark } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import type { ListingSummaryDto } from "@/features/market/model/types";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";

function formatQty(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    n,
  );
}

function formatPriceShare(price: number): string {
  return `${price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB / share`;
}

function brokerInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

type Props = {
  listing: ListingSummaryDto;
  inWatchlist: boolean;
  watchlistBusy: boolean;
  canUseWatchlist: boolean;
  onToggleWatchlist: () => void;
};

export function ListingExplorerCard({
  listing,
  inWatchlist,
  watchlistBusy,
  canUseWatchlist,
  onToggleWatchlist,
}: Props) {
  const t = useTranslations("investor.listings");
  const name = listing.instrumentName?.trim() || listing.ticker?.trim() || "—";
  const sector = listing.sector?.trim().toUpperCase() || "—";
  const ticker = listing.ticker?.trim().toUpperCase();
  const brokerLabel =
    listing.brokerInstitution?.trim() ||
    listing.brokerName?.trim() ||
    t("broker");

  return (
    <article className="border-border/80 bg-card flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <span className="bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-100 inline-flex max-w-[70%] truncate rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase">
          {sector}
        </span>
        <button
          type="button"
          disabled={!canUseWatchlist || watchlistBusy}
          onClick={onToggleWatchlist}
          className={cn(
            "text-muted-foreground hover:text-foreground -mr-1 -mt-0.5 rounded-lg p-1.5 transition-colors disabled:pointer-events-none disabled:opacity-40",
            inWatchlist && "text-primary",
          )}
          aria-label={inWatchlist ? t("removeWatchlist") : t("addWatchlist")}
          title={
            !canUseWatchlist
              ? t("watchlistLocked")
              : inWatchlist
                ? t("removeWatchlist")
                : t("addWatchlist")
          }
        >
          <Bookmark
            className={cn("size-5", inWatchlist && "fill-current")}
            strokeWidth={1.75}
            aria-hidden
          />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-1 px-5 pt-3 pb-4">
        <h3 className="text-foreground text-lg leading-snug font-bold tracking-tight">
          {name}
        </h3>
        {ticker ? (
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {ticker}
          </p>
        ) : null}
        <p className="text-foreground pt-2 text-2xl font-bold tabular-nums">
          {formatPriceShare(listing.price)}
        </p>
        {listing.securityReferencePrice != null ? (
          <p className="text-muted-foreground text-xs">
            {t("referencePriceShort", {
              price: listing.securityReferencePrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
            })}
          </p>
        ) : null}
        <p className="text-muted-foreground text-sm">
          {t("qtyLabel", { qty: formatQty(listing.quantity) })}
        </p>
      </div>

      <div className="border-border mt-auto flex items-center justify-between gap-3 border-t px-5 py-4">
        <div className="text-muted-foreground flex min-w-0 items-center gap-2.5 text-xs">
          <span className="bg-muted text-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
            {brokerInitials(listing.brokerName)}
          </span>
          <span className="truncate font-medium text-foreground/90">
            {brokerLabel}
          </span>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          <Link
            href={`/market/${listing.id}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-lg px-3 text-xs font-medium",
            )}
          >
            {t("viewDetails")}
          </Link>
          <Link
            href={`/market/securities/${listing.securityId}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-muted-foreground rounded-lg px-3 text-[11px]",
            )}
          >
            {t("viewSecurity")}
          </Link>
        </div>
      </div>
    </article>
  );
}
