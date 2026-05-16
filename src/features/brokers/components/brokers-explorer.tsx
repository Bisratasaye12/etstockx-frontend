"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { useBrokerDirectory } from "@/features/profiles/api/use-broker-directory";
import {
  USER_SEARCH_MIN_QUERY_LENGTH,
  useUserSearch,
} from "@/features/profiles/api/use-user-search";
import { userSearchItemToBrokerDirectoryEntry } from "@/features/profiles/lib/user-search-mappers";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { cn } from "@/shared/lib/utils";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  filterBrokers,
  type SectorFilter,
} from "@/features/brokers/lib/filter-brokers";
import { BrokerDirectoryCard } from "@/features/brokers/components/broker-directory-card";

const SECTORS: { value: SectorFilter | null; labelKey: string }[] = [
  { value: null, labelKey: "chipAll" },
  { value: "Banking", labelKey: "chipBanking" },
  { value: "Telecom", labelKey: "chipTelecom" },
  { value: "Agriculture", labelKey: "chipAgriculture" },
];

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_PAGE_SIZE = 50;

export function BrokersExplorer() {
  const t = useTranslations("investor.brokers");
  const { status } = useSession();

  const [search, setSearch] = useState("");
  const [sector, setSector] = useState<SectorFilter | null>(null);
  const [acceptingOnly, setAcceptingOnly] = useState(false);

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const useApiSearch =
    debouncedSearch.trim().length >= USER_SEARCH_MIN_QUERY_LENGTH;

  const directory = useBrokerDirectory({ enabled: !useApiSearch });
  const userSearch = useUserSearch({
    role: "Broker",
    q: debouncedSearch,
    page: 1,
    pageSize: SEARCH_PAGE_SIZE,
    enabled: status === "authenticated" && useApiSearch,
  });

  const filtered = useMemo(() => {
    if (useApiSearch) {
      const items = userSearch.data?.items ?? [];
      let brokers = items.map(userSearchItemToBrokerDirectoryEntry);
      if (acceptingOnly) {
        brokers = brokers.filter((b) => b.isAcceptingRequests);
      }
      return filterBrokers(brokers, {
        search: "",
        sector,
        acceptingOnly: false,
      });
    }
    return filterBrokers(directory.data ?? [], {
      search,
      sector,
      acceptingOnly,
    });
  }, [
    useApiSearch,
    userSearch.data?.items,
    directory.data,
    search,
    sector,
    acceptingOnly,
  ]);

  const isLoading = useApiSearch ? userSearch.isLoading : directory.isLoading;
  const error = useApiSearch ? userSearch.error : directory.error;

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

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-foreground text-3xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
        <p className="text-muted-foreground shrink-0 text-sm font-medium tabular-nums">
          {t("verifiedCount", { count: filtered.length })}
        </p>
      </div>

      <section className="border-border/80 bg-card space-y-5 rounded-2xl border p-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-11 rounded-xl border pl-10 text-base md:text-sm"
              aria-label={t("searchPlaceholder")}
            />
          </div>
          {search.trim().length > 0 &&
          search.trim().length < USER_SEARCH_MIN_QUERY_LENGTH ? (
            <p className="text-muted-foreground text-xs">
              {t("searchMinChars", { count: USER_SEARCH_MIN_QUERY_LENGTH })}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {SECTORS.map(({ value, labelKey }) => {
              const active = sector === value;
              return (
                <button
                  key={labelKey}
                  type="button"
                  onClick={() => setSector(value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
                    active
                      ? "border-primary/30 bg-primary/15 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted/60",
                    useApiSearch && value !== null && "opacity-60",
                  )}
                  disabled={useApiSearch && value !== null}
                  title={
                    useApiSearch && value !== null
                      ? t("sectorFilterDisabledDuringSearch")
                      : undefined
                  }
                >
                  {t(labelKey)}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 lg:shrink-0">
            <span className="text-muted-foreground text-sm font-medium">
              {t("acceptingOnlyLabel")}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={acceptingOnly}
              onClick={() => setAcceptingOnly((v) => !v)}
              className={cn(
                "relative h-7 w-12 shrink-0 rounded-full border-2 transition-colors",
                acceptingOnly
                  ? "border-primary bg-primary"
                  : "border-border bg-muted",
              )}
            >
              <span
                className={cn(
                  "bg-background absolute top-0.5 size-5 rounded-full shadow-sm transition-transform",
                  acceptingOnly ? "left-6" : "left-0.5",
                )}
                aria-hidden
              />
            </button>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border-border/60 bg-muted/30 h-[260px] animate-pulse rounded-2xl border"
            />
          ))}
        </div>
      ) : error ? (
        <p className="text-destructive text-sm" role="alert">
          {getApiErrorMessage(error) || t("loadError")}
        </p>
      ) : filtered.length === 0 ? (
        <div className="border-border/80 bg-card rounded-2xl border px-6 py-16 text-center shadow-sm">
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
          <Button
            type="button"
            variant="link"
            className="mt-2 text-primary"
            onClick={() => {
              setSearch("");
              setSector(null);
              setAcceptingOnly(false);
            }}
          >
            {t("resetFilters")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <BrokerDirectoryCard key={b.userId} broker={b} />
          ))}
        </div>
      )}
    </div>
  );
}
