"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ArrowLeft, Bookmark, Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { browserApi } from "@/shared/api/browser-api";
import type { ListingDetailDto } from "@/features/market/model/types";
import { marketKeys } from "@/features/market/api/keys";
import { profileKeys } from "@/features/profiles/api/keys";
import { useWatchlist } from "@/features/profiles/api/use-watchlist";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { cn } from "@/shared/lib/utils";
import { Button, buttonVariants } from "@/shared/ui/button";
import { useSecurityPrediction } from "@/features/market/api/use-security-prediction";
import { PredictionBadge } from "@/features/market/components/prediction-badge";

type Props = { listingId: string };

function formatMoney(price: number, currency: string | null | undefined) {
  const cur = (currency ?? "ETB").trim() || "ETB";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur.length === 3 ? cur : "ETB",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${price.toLocaleString()} ${cur}`;
  }
}

function formatQty(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    n,
  );
}

export function ListingDetailView({ listingId }: Props) {
  const t = useTranslations("investor.listings");
  const { data: session, status } = useSession();
  const isClient = session?.user?.role === "Client";
  const isActivated = Boolean(session?.user?.isActivated);

  const detailQuery = useQuery({
    queryKey: marketKeys.listingDetail(listingId),
    enabled: status === "authenticated" && Boolean(session?.accessToken),
    queryFn: async () => {
      const { data } = await browserApi.get<ListingDetailDto>(
        `/v1/market/listings/${listingId}`,
      );
      return data;
    },
  });

  const predictionQuery = useSecurityPrediction(
    detailQuery.data?.securityId ?? "",
    status === "authenticated" && Boolean(detailQuery.data?.securityId),
  );

  const { data: watchlist } = useWatchlist({
    enabled: status === "authenticated" && isClient && isActivated,
  });

  const inWatchlist =
    watchlist?.some((w) => w.listingId === listingId) ?? false;

  const qc = useQueryClient();

  const addWl = useMutation({
    mutationFn: async () => {
      await browserApi.post("/v1/profiles/client/watchlist", {
        listingId,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.watchlist() });
    },
  });

  const removeWl = useMutation({
    mutationFn: async () => {
      await browserApi.delete(`/v1/profiles/client/watchlist/${listingId}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.watchlist() });
    },
  });

  if (status === "loading") {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center gap-2">
        <Loader2 className="size-6 animate-spin" aria-hidden />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="border-border/80 bg-card mx-auto max-w-lg space-y-4 rounded-2xl border p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("signInTitle")}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t("signInBody")}
        </p>
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "default" }),
            "inline-flex h-10 items-center justify-center rounded-full px-8 font-semibold",
          )}
        >
          {t("signInCta")}
        </Link>
      </div>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center gap-2">
        <Loader2 className="size-6 animate-spin" aria-hidden />
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="border-border/80 bg-card mx-auto max-w-lg space-y-4 rounded-2xl border p-8 text-center">
        <p className="text-destructive text-sm">
          {getApiErrorMessage(detailQuery.error) || t("detailLoadError")}
        </p>
        <Link
          href="/market"
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}
        >
          {t("backToListings")}
        </Link>
      </div>
    );
  }

  const d = detailQuery.data;
  const name = d.instrumentName?.trim() || d.ticker?.trim() || "—";
  const sector = d.sector?.trim().toUpperCase() || "—";
  const broker =
    d.brokerInstitution?.trim() || d.brokerName?.trim() || t("broker");

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <Link
        href="/market"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToListings")}
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <span className="bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-100 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase">
            {sector}
          </span>
          <h1 className="text-foreground text-3xl font-bold tracking-tight">
            {name}
          </h1>
          {d.ticker ? (
            <p className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              {d.ticker}
            </p>
          ) : null}
          {predictionQuery.data ? (
            <PredictionBadge
              prediction={predictionQuery.data}
              currency={d.currency}
            />
          ) : null}
        </div>
        {isClient && isActivated ? (
          <Button
            type="button"
            variant={inWatchlist ? "secondary" : "outline"}
            className="h-10 shrink-0 gap-2 rounded-full px-4"
            disabled={addWl.isPending || removeWl.isPending}
            onClick={() => (inWatchlist ? removeWl.mutate() : addWl.mutate())}
          >
            <Bookmark
              className={cn("size-4", inWatchlist && "fill-current")}
              aria-hidden
            />
            {inWatchlist ? t("removeWatchlist") : t("addWatchlist")}
          </Button>
        ) : null}
      </header>

      <div className="border-border/80 bg-card divide-border grid gap-0 divide-y rounded-2xl border shadow-sm sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="space-y-1 p-6">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            {t("broker")}
          </p>
          <p className="text-foreground text-lg font-semibold">{broker}</p>
        </div>
        <div className="space-y-1 p-6">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            {t("status")}
          </p>
          <p className="text-foreground text-lg font-semibold">
            {d.status ?? "—"}
          </p>
        </div>
        <div className="space-y-1 p-6">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            {t("priceLabel")}
          </p>
          <p className="text-foreground text-2xl font-bold tabular-nums">
            {formatMoney(d.price, d.currency)}
          </p>
          <p className="text-muted-foreground text-xs">{t("perShare")}</p>
        </div>
        {d.securityReferencePrice != null ? (
          <div className="space-y-1 p-6">
            <p className="text-muted-foreground text-xs font-medium uppercase">
              {t("referencePriceLabel")}
            </p>
            <p className="text-foreground text-lg font-semibold tabular-nums">
              {formatMoney(d.securityReferencePrice, d.currency)}
            </p>
            <p className="text-muted-foreground text-xs">
              {t("referencePriceHint")}
            </p>
          </div>
        ) : null}
        <div className="space-y-1 p-6">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            {t("volumeLabel")}
          </p>
          <p className="text-foreground text-lg font-semibold tabular-nums">
            {formatQty(d.quantity)}
          </p>
        </div>
        {d.minLotSize != null ? (
          <div className="space-y-1 p-6 sm:col-span-2">
            <p className="text-muted-foreground text-xs font-medium uppercase">
              {t("minLotLabel")}
            </p>
            <p className="text-foreground text-lg font-semibold tabular-nums">
              {formatQty(d.minLotSize)}
            </p>
          </div>
        ) : null}
        <div className="space-y-1 p-6 sm:col-span-2">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            {t("views")}
          </p>
          <p className="text-foreground text-lg font-semibold tabular-nums">
            {d.viewCount}
          </p>
        </div>
        {(d.validFrom || d.validTo) && (
          <div className="space-y-1 p-6 sm:col-span-2">
            <p className="text-muted-foreground text-xs font-medium uppercase">
              {t("validity")}
            </p>
            <p className="text-foreground text-sm">
              {[d.validFrom, d.validTo].filter(Boolean).join(" → ") || "—"}
            </p>
          </div>
        )}
        {d.notes?.trim() ? (
          <div className="space-y-2 p-6 sm:col-span-2">
            <p className="text-muted-foreground text-xs font-medium uppercase">
              {t("notes")}
            </p>
            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {d.notes.trim()}
            </p>
          </div>
        ) : null}
      </div>

      {isClient && isActivated ? (
        <div className="flex flex-wrap justify-end gap-3">
          <Link
            href={`/requests/new?brokerId=${encodeURIComponent(d.brokerId)}&listingId=${encodeURIComponent(d.id)}`}
            className={cn(
              buttonVariants({ variant: "default" }),
              "inline-flex h-11 items-center gap-2 rounded-full px-6 font-semibold",
            )}
          >
            <Send className="size-4" aria-hidden />
            {t("submitBuyRequest")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
