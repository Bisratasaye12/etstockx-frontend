"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  Clock,
  GripVertical,
  Loader2,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { browserApi } from "@/shared/api/browser-api";
import type { WatchlistItem } from "@/shared/api/types";
import type { ListingSummaryDto } from "@/features/market/model/types";
import { useWatchlist } from "@/features/profiles/api/use-watchlist";
import {
  listingSummariesById,
  useMarketListingSummaries,
} from "@/features/market/api/use-market-listing-summaries";
import { profileKeys } from "@/features/profiles/api/keys";
import { marketKeys } from "@/features/market/api/keys";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { formatWatchlistSavedRelative } from "@/features/investor/lib/format-saved-relative";
import { formatListingPrice } from "@/features/investor/lib/request-status-presentational";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

const WATCHLIST_CATALOG_PAGE_SIZE = 500;

function formatQty(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    n,
  );
}

function listingIsTradeable(listing: ListingSummaryDto | undefined): boolean {
  return listing?.status === "Active";
}

function brokerLabel(listing: ListingSummaryDto | undefined, fallback: string) {
  if (!listing) return fallback;
  return (
    listing.brokerInstitution?.trim() || listing.brokerName?.trim() || fallback
  );
}

type RowModel = {
  watch: WatchlistItem;
  listing: ListingSummaryDto | undefined;
  tradeable: boolean;
  catalogHit: boolean;
};

export function InvestorWatchlistView() {
  const { data: session } = useSession();
  const t = useTranslations("investor.watchlist");
  const qc = useQueryClient();
  const isActivated = Boolean(session?.user?.isActivated);

  const { data: watchlist, isLoading: wlLoading } = useWatchlist({
    enabled: isActivated,
  });
  const { data: catalog, isLoading: catLoading } = useMarketListingSummaries({
    enabled: isActivated,
    pageSize: WATCHLIST_CATALOG_PAGE_SIZE,
  });

  const byId = useMemo(() => listingSummariesById(catalog), [catalog]);

  const rows = useMemo((): RowModel[] => {
    const list = [...(watchlist ?? [])].sort((a, b) => {
      const oa = a.displayOrder ?? 0;
      const ob = b.displayOrder ?? 0;
      if (oa !== ob) return oa - ob;
      return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
    });
    return list.map((watch) => {
      const listing = byId.get(watch.listingId);
      return {
        watch,
        listing,
        catalogHit: Boolean(listing),
        tradeable: listingIsTradeable(listing),
      };
    });
  }, [watchlist, byId]);

  const unavailableCount = useMemo(
    () => rows.filter((r) => !r.tradeable).length,
    [rows],
  );

  const removeMutation = useMutation({
    mutationFn: async (listingId: string) => {
      await browserApi.delete(`/v1/profiles/client/watchlist/${listingId}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.watchlist() });
      void qc.invalidateQueries({ queryKey: marketKeys.all });
    },
  });

  if (!isActivated) {
    return (
      <Card className="border-border/80 max-w-xl shadow-sm">
        <CardHeader>
          <CardTitle>{t("lockedTitle")}</CardTitle>
          <CardDescription>{t("lockedBody")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/profile/client"
            className={cn(
              buttonVariants({ variant: "default", size: "default" }),
              "h-11 rounded-full px-8 font-semibold",
            )}
          >
            {t("completeProfile")}
          </Link>
        </CardContent>
      </Card>
    );
  }

  const loading = wlLoading || catLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-foreground text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {unavailableCount > 0 ? (
            <div
              className="border-amber-500/25 bg-amber-500/10 text-amber-950 dark:text-amber-100 flex max-w-xs items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium dark:border-amber-500/30"
              role="status"
            >
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              {t("inlineUnavailable", { count: unavailableCount })}
            </div>
          ) : null}
          <p className="text-muted-foreground text-sm font-medium tabular-nums">
            {t("savedCount", { count: rows.length })}
          </p>
        </div>
      </div>

      {unavailableCount > 0 ? (
        <div
          className="border-amber-500/25 bg-amber-500/10 flex gap-3 rounded-xl border px-4 py-3.5"
          role="alert"
        >
          <AlertTriangle
            className="text-amber-700 dark:text-amber-300 mt-0.5 size-5 shrink-0"
            aria-hidden
          />
          <div>
            <p className="text-foreground text-sm font-semibold">
              {t("bannerTitle")}
            </p>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              {t("bannerBody", { count: unavailableCount })}
            </p>
          </div>
        </div>
      ) : null}

      {removeMutation.isError ? (
        <p className="text-destructive text-sm" role="alert">
          {getApiErrorMessage(removeMutation.error)}
        </p>
      ) : null}

      {loading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-16 text-sm">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          {t("loading")}
        </div>
      ) : rows.length === 0 ? (
        <div className="border-border bg-card rounded-xl border px-6 py-16 text-center shadow-sm">
          <p className="text-foreground text-lg font-semibold">
            {t("emptyTitle")}
          </p>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-relaxed">
            {t("emptyBody")}
          </p>
          <Link
            href="/market"
            className={cn(
              buttonVariants({ variant: "default", size: "default" }),
              "mt-6 inline-flex h-11 rounded-full px-8 font-semibold",
            )}
          >
            {t("browse")}
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {rows.map(({ watch, listing, tradeable, catalogHit }) => {
            const name =
              listing?.instrumentName?.trim() ||
              listing?.ticker?.trim() ||
              t("unknownListing");
            const ticker = listing?.ticker?.trim().toUpperCase();
            const sector = listing?.sector?.trim() || t("sectorUnknown");
            const saved = formatWatchlistSavedRelative(watch.addedAt, t);
            const broker = brokerLabel(listing, t("brokerUnknown"));
            const priceLabel =
              listing && tradeable
                ? formatListingPrice(listing.price, listing.currency)
                : "—";
            const qtyLabel =
              listing && tradeable ? formatQty(listing.quantity) : "—";

            return (
              <li key={watch.id}>
                <article className="border-border/80 bg-card flex flex-col gap-5 rounded-xl border px-4 py-5 shadow-sm sm:px-6 lg:flex-row lg:items-center lg:gap-8">
                  <div className="text-muted-foreground/50 hidden shrink-0 lg:block">
                    <GripVertical className="size-5" aria-hidden />
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-foreground text-lg font-bold tracking-tight">
                        {name}
                      </h2>
                      {ticker ? (
                        <span className="bg-primary/12 text-primary border-primary/15 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold tracking-wide uppercase">
                          {ticker}
                        </span>
                      ) : null}
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                          tradeable
                            ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100",
                        )}
                      >
                        {tradeable
                          ? t("statusActive")
                          : catalogHit
                            ? t("statusUnavailable")
                            : t("statusNotInCatalog")}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">
                      {sector}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <Clock className="size-3.5 shrink-0" aria-hidden />
                      {saved}
                    </p>
                  </div>

                  <div className="grid flex-1 gap-6 sm:grid-cols-3 lg:max-w-2xl">
                    <div>
                      <p className="text-muted-foreground text-xs font-medium">
                        {t("indicativePrice")}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-base font-bold tabular-nums",
                          tradeable ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {priceLabel}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs font-medium">
                        {t("availableQty")}
                      </p>
                      <p className="text-foreground mt-1 text-base font-bold tabular-nums">
                        {qtyLabel}
                        {tradeable ? (
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            {t("sharesSuffix")}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="bg-muted text-muted-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
                        <Building2 className="size-4" aria-hidden />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs font-medium">
                          {t("broker")}
                        </p>
                        <p className="text-foreground mt-0.5 text-sm font-semibold">
                          {broker}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-border pt-4 lg:border-t-0 lg:pt-0">
                    <button
                      type="button"
                      onClick={() => removeMutation.mutate(watch.listingId)}
                      disabled={removeMutation.isPending}
                      className="text-destructive hover:text-destructive/90 inline-flex items-center gap-1.5 text-sm font-semibold disabled:opacity-50"
                    >
                      <Trash2 className="size-4" aria-hidden />
                      {t("remove")}
                    </button>
                    {tradeable ? (
                      <Link
                        href={`/market/${watch.listingId}`}
                        className={cn(
                          buttonVariants({
                            variant: "outline",
                            size: "default",
                          }),
                          "h-10 rounded-lg border-primary px-5 font-semibold text-primary hover:bg-primary/5",
                        )}
                      >
                        {t("viewListing")}
                      </Link>
                    ) : (
                      <span
                        className="border-border bg-muted/60 text-muted-foreground inline-flex h-10 cursor-not-allowed items-center justify-center rounded-lg border px-5 text-sm font-semibold"
                        title={t("viewUnavailableHint")}
                      >
                        {t("viewUnavailable")}
                      </span>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
