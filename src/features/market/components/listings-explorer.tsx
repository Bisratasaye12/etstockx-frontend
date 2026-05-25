"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/shared/i18n/routing";
import { browserApi } from "@/shared/api/browser-api";
import type { ListingSummaryDto } from "@/features/market/model/types";
import {
  marketKeys,
  type ListingsBrowseFilters,
} from "@/features/market/api/keys";
import { profileKeys } from "@/features/profiles/api/keys";
import { useWatchlist } from "@/features/profiles/api/use-watchlist";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button, buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";
import { ListingExplorerCard } from "@/features/market/components/listing-explorer-card";
import { useMarketSecurities } from "@/features/market/api/use-market-securities";

const PAGE_SIZE = 9;

type Paged<T> = {
  items: T[] | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
};

function readPositiveInt(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function readOptionalNumber(raw: string | null): number | undefined {
  if (raw === null || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function buildBrowseFilters(sp: URLSearchParams): ListingsBrowseFilters {
  const securityId = sp.get("securityId")?.trim();
  return {
    securityId: securityId || undefined,
    sector: sp.get("sector")?.trim() || undefined,
    minPrice: readOptionalNumber(sp.get("minPrice")),
    maxPrice: readOptionalNumber(sp.get("maxPrice")),
    minQuantity: readOptionalNumber(sp.get("minQuantity")),
    page: readPositiveInt(sp.get("page"), 1),
    pageSize: PAGE_SIZE,
  };
}

export function ListingsExplorer() {
  const t = useTranslations("investor.listings");
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const spKey = sp.toString();

  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const isClient = session?.user?.role === "Client";
  const isActivated = Boolean(session?.user?.isActivated);

  const nlpQuery = (sp.get("q") ?? "").trim();
  const browseFilters = useMemo(
    () => buildBrowseFilters(new URLSearchParams(spKey)),
    [spKey],
  );

  const [nlpDraft, setNlpDraft] = useState(nlpQuery);
  const [draftSector, setDraftSector] = useState(sp.get("sector") ?? "");
  const [draftMinPrice, setDraftMinPrice] = useState(sp.get("minPrice") ?? "");
  const [draftMaxPrice, setDraftMaxPrice] = useState(sp.get("maxPrice") ?? "");
  const [draftMinQty, setDraftMinQty] = useState(sp.get("minQuantity") ?? "");
  const [draftSecurityId, setDraftSecurityId] = useState(
    sp.get("securityId") ?? "",
  );
  const [filtersOpen, setFiltersOpen] = useState(true);
  const securitiesForFilter = useMarketSecurities(
    "",
    1,
    100,
    status === "authenticated",
  );

  useEffect(() => {
    setNlpDraft(nlpQuery);
  }, [nlpQuery]);

  useEffect(() => {
    const p = new URLSearchParams(spKey);
    setDraftSector(p.get("sector") ?? "");
    setDraftMinPrice(p.get("minPrice") ?? "");
    setDraftMaxPrice(p.get("maxPrice") ?? "");
    setDraftMinQty(p.get("minQuantity") ?? "");
    setDraftSecurityId(p.get("securityId") ?? "");
  }, [spKey]);

  const listQuery = useQuery({
    queryKey: nlpQuery
      ? marketKeys.listingSearch(nlpQuery, browseFilters.page, PAGE_SIZE)
      : marketKeys.listingBrowse(browseFilters),
    enabled: status === "authenticated" && Boolean(accessToken),
    queryFn: async () => {
      if (nlpQuery) {
        const { data } = await browserApi.get<Paged<ListingSummaryDto>>(
          "/v1/market/listings/search",
          {
            params: {
              q: nlpQuery,
              page: browseFilters.page,
              pageSize: PAGE_SIZE,
            },
          },
        );
        return data;
      }
      const params: Record<string, string | number> = {
        page: browseFilters.page,
        pageSize: PAGE_SIZE,
      };
      if (browseFilters.sector) params.sector = browseFilters.sector;
      if (browseFilters.minPrice != null)
        params.minPrice = browseFilters.minPrice;
      if (browseFilters.maxPrice != null)
        params.maxPrice = browseFilters.maxPrice;
      if (browseFilters.minQuantity != null)
        params.minQuantity = browseFilters.minQuantity;
      if (browseFilters.securityId)
        params.securityId = browseFilters.securityId;
      const { data } = await browserApi.get<Paged<ListingSummaryDto>>(
        "/v1/market/listings",
        { params },
      );
      return data;
    },
  });

  const { data: watchlist } = useWatchlist({
    enabled: status === "authenticated" && isClient && isActivated,
  });

  const watchIds = useMemo(() => {
    const s = new Set<string>();
    for (const w of watchlist ?? []) s.add(w.listingId);
    return s;
  }, [watchlist]);

  const qc = useQueryClient();

  const addWl = useMutation({
    mutationFn: async (listingId: string) => {
      await browserApi.post("/v1/profiles/client/watchlist", { listingId });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.watchlist() });
      void qc.invalidateQueries({ queryKey: marketKeys.all });
    },
  });

  const removeWl = useMutation({
    mutationFn: async (listingId: string) => {
      await browserApi.delete(`/v1/profiles/client/watchlist/${listingId}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.watchlist() });
      void qc.invalidateQueries({ queryKey: marketKeys.all });
    },
  });

  const pushParams = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router],
  );

  const onAiSearch = () => {
    const q = nlpDraft.trim();
    if (!q) return;
    const p = new URLSearchParams();
    p.set("q", q);
    p.set("page", "1");
    pushParams(p);
  };

  const onApplyFilters = () => {
    const p = new URLSearchParams(spKey);
    p.delete("q");
    p.set("page", "1");
    if (draftSector.trim()) p.set("sector", draftSector.trim());
    else p.delete("sector");
    if (draftMinPrice.trim()) p.set("minPrice", draftMinPrice.trim());
    else p.delete("minPrice");
    if (draftMaxPrice.trim()) p.set("maxPrice", draftMaxPrice.trim());
    else p.delete("maxPrice");
    if (draftMinQty.trim()) p.set("minQuantity", draftMinQty.trim());
    else p.delete("minQuantity");
    if (draftSecurityId.trim()) p.set("securityId", draftSecurityId.trim());
    else p.delete("securityId");
    pushParams(p);
  };

  const onClearSearch = () => {
    router.push(pathname);
  };

  const onClearQueryChip = () => {
    const p = new URLSearchParams(spKey);
    p.delete("q");
    p.set("page", "1");
    pushParams(p);
    setNlpDraft("");
  };

  const onBrowseAll = () => {
    router.push(pathname);
  };

  const onPopularCategory = (sector: string) => {
    const p = new URLSearchParams();
    p.set("sector", sector);
    p.set("page", "1");
    pushParams(p);
  };

  const setPage = (page: number) => {
    const p = new URLSearchParams(spKey);
    p.set("page", String(page));
    pushParams(p);
  };

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(
    1,
    listQuery.data?.totalPages ??
      Math.ceil(total / (listQuery.data?.pageSize ?? PAGE_SIZE)),
  );
  const page = browseFilters.page;

  if (status === "loading") {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center gap-2 text-sm">
        <Loader2 className="size-5 animate-spin" aria-hidden />
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

  if (session?.user?.role === "Client" && !isActivated) {
    return (
      <div className="border-border/80 bg-card mx-auto max-w-lg space-y-4 rounded-2xl border p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("activateTitle")}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t("activateBody")}
        </p>
        <Link
          href="/profile/client"
          className={cn(
            buttonVariants({ variant: "default" }),
            "inline-flex h-10 items-center justify-center rounded-full px-8 font-semibold",
          )}
        >
          {t("activateCta")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-foreground text-3xl font-bold tracking-tight">
            {t("explorerTitle")}
          </h1>
          <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
            {t("explorerSubtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:pt-1">
          <Link
            href="/market/securities"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-9 rounded-full px-4 text-xs font-medium",
            )}
          >
            {t("browseSecurities")}
          </Link>
          {nlpQuery ? (
            <span className="border-border bg-muted/50 text-foreground inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium">
              <span className="truncate">
                {t("queryChip", { query: nlpQuery })}
              </span>
              <button
                type="button"
                onClick={onClearQueryChip}
                className="text-muted-foreground hover:text-foreground rounded-full p-0.5"
                aria-label={t("clearQueryChip")}
              >
                <X className="size-3.5" />
              </button>
            </span>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-full border px-4"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            {t("filtersToggle")}
          </Button>
        </div>
      </div>

      {nlpQuery ? (
        <div className="border-sky-200/80 bg-sky-50/90 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-50 flex flex-col gap-2 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5 text-sm">
            <p className="font-medium">
              {t("showingForNlp", { query: nlpQuery })}
            </p>
            <p className="text-sky-900/80 dark:text-sky-100/80">
              {t("listingsFound", { count: total })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClearSearch}
            className="text-primary shrink-0 text-sm font-semibold hover:underline"
          >
            {t("clearSearch")}
          </button>
        </div>
      ) : null}

      <section className="border-border/80 bg-card space-y-5 rounded-2xl border p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <div className="relative min-w-0 flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={nlpDraft}
              onChange={(e) => setNlpDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onAiSearch();
              }}
              placeholder={t("aiSearchPlaceholder")}
              className="h-11 rounded-xl border pl-10 text-base md:text-sm"
              aria-label={t("aiSearchPlaceholder")}
            />
          </div>
          <Button
            type="button"
            className="h-11 shrink-0 rounded-xl px-6 font-semibold"
            onClick={onAiSearch}
          >
            {t("aiSearchButton")}
          </Button>
        </div>

        {filtersOpen ? (
          <>
            <p className="text-muted-foreground text-xs">{t("filtersHint")}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1.5 text-sm sm:col-span-2 lg:col-span-4">
                <span className="text-muted-foreground font-medium">
                  {t("securityFilterLabel")}
                </span>
                <select
                  value={draftSecurityId}
                  onChange={(e) => setDraftSecurityId(e.target.value)}
                  className="border-input bg-background text-foreground h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">{t("securityFilterAll")}</option>
                  {(securitiesForFilter.data?.items ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.ticker} — {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-muted-foreground font-medium">
                  {t("sectorLabel")}
                </span>
                <select
                  value={draftSector}
                  onChange={(e) => setDraftSector(e.target.value)}
                  className="border-input bg-background text-foreground h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">{t("sectorAll")}</option>
                  <option value="Finance">Finance</option>
                  <option value="Tech">Tech</option>
                  <option value="Banking">Banking</option>
                  <option value="Telecom">Telecom</option>
                  <option value="Insurance">Insurance</option>
                </select>
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-muted-foreground font-medium">
                  {t("minPriceLabel")}
                </span>
                <Input
                  inputMode="decimal"
                  value={draftMinPrice}
                  onChange={(e) => setDraftMinPrice(e.target.value)}
                  placeholder="0"
                  className="h-11 rounded-xl"
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-muted-foreground font-medium">
                  {t("maxPriceLabel")}
                </span>
                <Input
                  inputMode="decimal"
                  value={draftMaxPrice}
                  onChange={(e) => setDraftMaxPrice(e.target.value)}
                  placeholder="Any"
                  className="h-11 rounded-xl"
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-muted-foreground font-medium">
                  {t("minQtyLabel")}
                </span>
                <Input
                  inputMode="numeric"
                  value={draftMinQty}
                  onChange={(e) => setDraftMinQty(e.target.value)}
                  placeholder="1"
                  className="h-11 rounded-xl"
                />
              </label>
            </div>
            <div className="flex justify-end border-t pt-1">
              <button
                type="button"
                onClick={onApplyFilters}
                className="text-primary text-sm font-semibold hover:underline"
              >
                {t("applyFilters")}
              </button>
            </div>
          </>
        ) : null}
      </section>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-muted-foreground text-sm font-medium">
          {t("countLabel", { count: total })}
        </p>
        {listQuery.isFetching ? (
          <Loader2 className="text-muted-foreground size-4 animate-spin" />
        ) : null}
      </div>

      {listQuery.isError ? (
        <p className="text-destructive text-sm" role="alert">
          {getApiErrorMessage(listQuery.error) || t("loadError")}
        </p>
      ) : null}

      {listQuery.isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border-border/60 bg-muted/30 h-[280px] animate-pulse rounded-2xl border"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="border-border/80 bg-card space-y-8 rounded-2xl border px-6 py-14 text-center shadow-sm md:px-12 md:py-16">
          <div className="bg-primary/10 text-primary mx-auto flex size-20 items-center justify-center rounded-full">
            <Search className="size-9" strokeWidth={1.5} aria-hidden />
          </div>
          <div className="mx-auto max-w-md space-y-3">
            <h2 className="text-foreground text-xl font-bold tracking-tight">
              {nlpQuery
                ? t("emptyTitle", { query: nlpQuery })
                : t("emptyTitleGeneric")}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("emptyBody")}
            </p>
          </div>
          <Button
            type="button"
            className="mx-auto rounded-full px-8 font-semibold"
            onClick={onBrowseAll}
          >
            {t("browseAll")}
          </Button>
          <div className="border-border mx-auto max-w-lg border-t pt-8">
            <p className="text-muted-foreground mb-4 text-[11px] font-semibold tracking-wider uppercase">
              {t("popularCategories")}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {(
                [
                  ["Agriculture", t("catAgriculture")],
                  ["Manufacturing", t("catManufacturing")],
                  ["Real Estate", t("catRealEstate")],
                  ["Export", t("catExport")],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onPopularCategory(value)}
                  className="border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/40 rounded-full border px-4 py-2 text-xs font-medium transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((listing) => {
            const inWl = watchIds.has(listing.id);
            const busy =
              addWl.isPending || removeWl.isPending || listQuery.isFetching;
            return (
              <ListingExplorerCard
                key={listing.id}
                listing={listing}
                inWatchlist={inWl}
                watchlistBusy={busy}
                canUseWatchlist={isClient && isActivated}
                onToggleWatchlist={() => {
                  if (!isClient || !isActivated) return;
                  if (inWl) removeWl.mutate(listing.id);
                  else addWl.mutate(listing.id);
                }}
              />
            );
          })}
        </div>
      )}

      {items.length > 0 ? (
        <nav
          className="text-muted-foreground flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row"
          aria-label="Pagination"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-w-[100px] rounded-full"
            disabled={page <= 1 || listQuery.isFetching}
            onClick={() => setPage(page - 1)}
          >
            {t("previous")}
          </Button>
          <p className="text-sm font-medium tabular-nums">
            {t("pagination", { page, totalPages })}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-w-[100px] rounded-full"
            disabled={page >= totalPages || listQuery.isFetching}
            onClick={() => setPage(page + 1)}
          >
            {t("next")}
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
