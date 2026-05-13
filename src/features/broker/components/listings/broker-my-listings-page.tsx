"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  Eye,
  Info,
  MoreHorizontal,
  PauseCircle,
  Pencil,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useRouter } from "@/shared/i18n/routing";
import { useBrokerListingsMine } from "@/features/broker/api/use-broker-listings-mine";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

type ListingTab = "all" | "active" | "paused" | "closed" | "pendingmoderation";
type SortOption = "newest" | "oldest" | "priceDesc" | "priceAsc";

function normalizeStatus(status: string | null | undefined) {
  return (status ?? "").toLowerCase().replace(/\s|_/g, "");
}

function toListingTab(status: string | null | undefined): ListingTab {
  const normalized = normalizeStatus(status);
  if (normalized.includes("pendingmoderation")) return "pendingmoderation";
  if (normalized.includes("paused")) return "paused";
  if (normalized.includes("closed")) return "closed";
  if (normalized.includes("active")) return "active";
  return "all";
}

function statusPillClass(status: string | null | undefined) {
  const key = toListingTab(status);
  if (key === "active") {
    return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
  }
  if (key === "paused") {
    return "bg-amber-500/10 text-amber-700 border-amber-500/20";
  }
  if (key === "pendingmoderation") {
    return "bg-sky-500/10 text-sky-700 border-sky-500/20";
  }
  if (key === "closed") {
    return "bg-slate-500/10 text-slate-700 border-slate-500/20";
  }
  return "bg-muted text-muted-foreground border-border";
}

function formatPrice(value: number, currency: string | null | undefined) {
  return `${(currency ?? "ETB").trim() || "ETB"} ${value.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`;
}

export function BrokerMyListingsPage() {
  const router = useRouter();
  const l = {
    loading: "Loading listings...",
    title: "My Listings",
    subtitle: "Manage all your published stock listings.",
    total: "total",
    active: "active",
    paused: "paused",
    pending: "pending",
    tabs: {
      all: "All",
      active: "Active",
      paused: "Paused",
      closed: "Closed",
      pendingModeration: "Pending Moderation",
    },
    filter: "Filter",
    unknownStatus: "Unknown",
    sectorFilter: "Sector filter",
    sectorAll: "Sector: All",
    sortBy: "Sort listings",
    sort: {
      newest: "Sort: Newest First",
      oldest: "Sort: Oldest First",
      priceHigh: "Sort: Price High to Low",
      priceLow: "Sort: Price Low to High",
    },
    table: {
      instrument: "Instrument",
      sector: "Sector",
      price: "Price (ETB)",
      quantity: "Quantity",
      status: "Status",
      actions: "Actions",
    },
    empty: "No listings found for the selected filters.",
    showing: (from: number, to: number, total: number) =>
      `Showing ${from} to ${to} of ${total} entries`,
    previous: "Previous",
    next: "Next",
  };
  const [tab, setTab] = useState<ListingTab>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [sector, setSector] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [pendingMenuRowId, setPendingMenuRowId] = useState<string | null>(null);
  const pageSize = 8;

  const listings = useBrokerListingsMine(1, 200);
  const items = useMemo(() => listings.data?.items ?? [], [listings.data]);

  const counts = items.reduce<Record<ListingTab, number>>(
    (acc, item) => {
      const key = toListingTab(item.status);
      if (key !== "all") acc[key] += 1;
      acc.all += 1;
      return acc;
    },
    { all: 0, active: 0, paused: 0, closed: 0, pendingmoderation: 0 },
  );

  const sectors = useMemo(() => {
    const unique = new Set<string>();
    for (const item of items) {
      const value = item.sector?.trim();
      if (value) unique.add(value);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const withStatus =
      tab === "all"
        ? items
        : items.filter((item) => toListingTab(item.status) === tab);
    const withSector =
      sector === "all"
        ? withStatus
        : withStatus.filter(
            (item) =>
              (item.sector ?? "").toLowerCase() === sector.toLowerCase(),
          );

    const sorted = [...withSector];
    sorted.sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      if (sortBy === "priceAsc") return a.price - b.price;
      if (sortBy === "priceDesc") return b.price - a.price;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return sorted;
  }, [items, tab, sector, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const paged = filtered.slice(startIdx, startIdx + pageSize);
  const from = filtered.length === 0 ? 0 : startIdx + 1;
  const to = Math.min(startIdx + pageSize, filtered.length);
  const focusedListing = filtered.find((item) => item.id === openRowId) ?? null;
  const spotlightRows = filtered.slice(0, 2);

  const tabs: Array<{ id: ListingTab; label: string }> = [
    { id: "all", label: l.tabs.all },
    { id: "active", label: l.tabs.active },
    { id: "paused", label: l.tabs.paused },
    { id: "closed", label: l.tabs.closed },
    { id: "pendingmoderation", label: l.tabs.pendingModeration },
  ];

  if (listings.isLoading) {
    return <p className="text-muted-foreground text-sm">{l.loading}</p>;
  }

  if (listings.isError) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {getApiErrorMessage(listings.error)}
      </p>
    );
  }

  if (focusedListing) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{l.title}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage and track your active, pending, and closed properties.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenRowId(null)}
          >
            {l.filter}
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            {spotlightRows.map((item) => {
              const isOpen = item.id === focusedListing.id;
              return (
                <Card key={item.id} className="overflow-visible">
                  <CardContent className="pt-4">
                    <div className="relative flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded-lg text-xs font-semibold">
                          IMG
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-semibold">
                              {item.instrumentName ?? item.ticker ?? "Listing"}
                            </h3>
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-full border px-2.5 py-1 text-xs font-medium",
                                statusPillClass(item.status),
                              )}
                            >
                              {item.status ?? l.unknownStatus}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {item.sector ?? "—"}
                          </p>
                          <p className="mt-1 text-3xl font-semibold">
                            {formatPrice(item.price, item.currency)}
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() =>
                            setOpenRowId((prev) =>
                              prev === item.id ? null : item.id,
                            )
                          }
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                        {isOpen ? (
                          <div className="border-border bg-background absolute right-0 z-20 mt-1 min-w-[220px] rounded-md border py-1 text-left shadow-md">
                            <button
                              type="button"
                              className="hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                              onClick={() =>
                                router.push(
                                  `/dashboard/broker/listings/${item.id}/edit`,
                                )
                              }
                            >
                              <Pencil className="size-4" />
                              Edit Listing
                            </button>
                            <button
                              type="button"
                              className="hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                              onClick={() =>
                                router.push(
                                  `/dashboard/broker/listings/${item.id}/performance`,
                                )
                              }
                            >
                              <BarChart3 className="size-4" />
                              View Performance
                            </button>
                            <button
                              type="button"
                              className="hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                            >
                              <PauseCircle className="size-4" />
                              Pause Listing
                            </button>
                            <button
                              type="button"
                              className="text-destructive hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                            >
                              <XCircle className="size-4" />
                              Close Listing
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-3 pt-4">
                <h3 className="text-xl font-semibold">Portfolio Overview</h3>
                <div className="flex items-center justify-between border-b pb-2 text-sm">
                  <span className="text-muted-foreground">Total Listings</span>
                  <span className="font-semibold">{counts.all}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active</span>
                  <span className="font-semibold">{counts.active}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-semibold">
                    {counts.pendingmoderation}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Closed</span>
                  <span className="font-semibold">{counts.closed}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-emerald-50/60">
              <CardContent className="pt-4">
                <div className="text-emerald-700 mb-2 flex items-center gap-2 font-semibold">
                  <TrendingUp className="size-4" />
                  High Demand Alert
                </div>
                <p className="text-sm text-emerald-900">
                  Selected listings are seeing increased inquiry activity this
                  week.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{l.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{l.subtitle}</p>
        </div>
        <div className="border-border bg-background rounded-lg border px-4 py-2 text-sm">
          <span className="text-foreground font-semibold">{counts.all}</span>{" "}
          <span className="text-muted-foreground">{l.total}</span>
          <span className="text-muted-foreground mx-2">·</span>
          <span className="text-emerald-700">
            {counts.active} {l.active}
          </span>
          <span className="text-muted-foreground mx-2">·</span>
          <span className="text-amber-700">
            {counts.paused} {l.paused}
          </span>
          <span className="text-muted-foreground mx-2">·</span>
          <span className="text-sky-700">
            {counts.pendingmoderation} {l.pending}
          </span>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="bg-muted inline-flex rounded-lg p-1">
              {tabs.map((tabItem) => (
                <button
                  key={tabItem.id}
                  type="button"
                  onClick={() => {
                    setTab(tabItem.id);
                    setPage(1);
                    setPendingMenuRowId(null);
                  }}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm transition-colors",
                    tab === tabItem.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tabItem.label}
                </button>
              ))}
            </div>

            {tab === "pendingmoderation" ? (
              <Button className="h-9 rounded-md px-3 text-sm">Filter</Button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <select
                    value={sector}
                    onChange={(e) => {
                      setSector(e.target.value);
                      setPage(1);
                    }}
                    className="border-border bg-background h-9 appearance-none rounded-lg border px-3 pr-8 text-sm"
                    aria-label={l.sectorFilter}
                  >
                    <option value="all">{l.sectorAll}</option>
                    {sectors.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2" />
                </div>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as SortOption);
                      setPage(1);
                    }}
                    className="border-border bg-background h-9 appearance-none rounded-lg border px-3 pr-8 text-sm"
                    aria-label={l.sortBy}
                  >
                    <option value="newest">{l.sort.newest}</option>
                    <option value="oldest">{l.sort.oldest}</option>
                    <option value="priceDesc">{l.sort.priceHigh}</option>
                    <option value="priceAsc">{l.sort.priceLow}</option>
                  </select>
                  <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2" />
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/45 text-muted-foreground">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">
                    {tab === "pendingmoderation"
                      ? "Property Details"
                      : l.table.instrument}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {tab === "pendingmoderation" ? "Location" : l.table.sector}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {tab === "pendingmoderation" ? "Price" : l.table.price}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {tab === "pendingmoderation"
                      ? "Submitted"
                      : l.table.quantity}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {l.table.status}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    {l.table.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td className="text-muted-foreground px-4 py-8" colSpan={6}>
                      {l.empty}
                    </td>
                  </tr>
                ) : (
                  paged.map((item) => (
                    <tr key={item.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3 font-medium">
                        {tab === "pendingmoderation" ? (
                          <div>
                            <p>{item.instrumentName ?? item.ticker ?? "—"}</p>
                            <p className="text-muted-foreground mt-1 text-xs">
                              {item.quantity.toLocaleString("en-US")} units
                            </p>
                          </div>
                        ) : (
                          item.ticker?.trim() || item.instrumentName || "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {tab === "pendingmoderation"
                          ? `${item.sector ?? "Unknown"}, Addis Ababa`
                          : (item.sector ?? "—")}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {formatPrice(item.price, item.currency)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3",
                          tab !== "pendingmoderation" && "tabular-nums",
                        )}
                      >
                        {tab === "pendingmoderation"
                          ? new Date(item.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : item.quantity.toLocaleString("en-US")}
                      </td>
                      <td className="relative px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs font-medium",
                            statusPillClass(item.status),
                          )}
                        >
                          {tab === "pendingmoderation"
                            ? "Pending Moderation"
                            : (item.status ?? l.unknownStatus)}
                        </Badge>
                        {tab === "pendingmoderation" &&
                        pendingMenuRowId === item.id ? (
                          <div className="border-border bg-background absolute top-12 right-2 z-20 min-w-[220px] rounded-md border py-1 text-left shadow-md">
                            <button
                              type="button"
                              className="hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                            >
                              <Eye className="size-4" />
                              View Details
                            </button>
                            <div className="text-muted-foreground flex items-start gap-2 border-t px-3 py-2 text-xs">
                              <Info className="mt-0.5 size-3.5 shrink-0" />
                              Under admin review. Edits not available.
                            </div>
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => {
                            if (tab === "pendingmoderation") {
                              setPendingMenuRowId((prev) =>
                                prev === item.id ? null : item.id,
                              );
                              return;
                            }
                            setOpenRowId(item.id);
                          }}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-muted-foreground text-sm">
              {l.showing(from, to, filtered.length)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage((v) => Math.max(1, v - 1))}
              >
                {l.previous}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
              >
                {l.next}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
