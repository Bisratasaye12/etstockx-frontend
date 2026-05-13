"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, History, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { useBrokerClientHistory } from "@/features/broker/api/use-broker-client-history";
import type { IncomingRequestDto } from "@/features/broker/model/types";
import { summarizeClientTradeRows } from "@/features/broker/lib/summarize-client-trade-rows";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const PAGE_SIZE = 8;

/** Stable fallback so `useMemo(..., [items])` deps are not a new `[]` each render. */
const EMPTY_INCOMING_ITEMS: IncomingRequestDto[] = [];

function normalizeStatus(status: string | null | undefined) {
  return (status ?? "").toLowerCase().replace(/\s+/g, "");
}

function statusPillClass(status: string | null | undefined) {
  const n = normalizeStatus(status);
  if (n.includes("reject")) {
    return "border-red-500/25 bg-red-500/10 text-red-800";
  }
  if (n.includes("filled") || n.includes("partiallyfilled")) {
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-800";
  }
  if (n.includes("negotiat")) {
    return "border-amber-500/25 bg-amber-500/10 text-amber-900";
  }
  return "border-border bg-muted text-muted-foreground";
}

function intentPill(kind: string | null | undefined) {
  const k = (kind ?? "").toLowerCase();
  if (k.includes("sell")) {
    return {
      labelKey: "intentSell" as const,
      className: "border-orange-500/25 bg-orange-500/10 text-orange-900",
    };
  }
  return {
    labelKey: "intentBuy" as const,
    className: "border-sky-500/25 bg-sky-500/10 text-sky-900",
  };
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function fmtDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function fmtMoney(n: number | null | undefined, currency: string | null) {
  if (n == null || Number.isNaN(n)) return "—";
  const cur = currency?.trim() || "ETB";
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${cur}`;
}

function fmtQty(n: number) {
  return n.toLocaleString("en-US");
}

function dateToStartIso(dateStr: string) {
  if (!dateStr) return undefined;
  const d = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function dateToEndIso(dateStr: string) {
  if (!dateStr) return undefined;
  const d = new Date(`${dateStr}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function requestDetailHref(row: IncomingRequestDto) {
  const kind = encodeURIComponent(row.kind ?? "Buy");
  return `/dashboard/broker/requests/${row.id}?kind=${kind}`;
}

export function BrokerClientTradeHistoryScreen({
  clientId,
  initialDisplayName,
}: {
  clientId: string;
  initialDisplayName?: string | null;
}) {
  const t = useTranslations("broker.clients");

  const [instrumentDraft, setInstrumentDraft] = useState("");
  const [fromDraft, setFromDraft] = useState("");
  const [toDraft, setToDraft] = useState("");

  const [instrumentApplied, setInstrumentApplied] = useState("");
  const [fromApplied, setFromApplied] = useState("");
  const [toApplied, setToApplied] = useState("");
  const [page, setPage] = useState(1);

  const fromIso = fromApplied ? dateToStartIso(fromApplied) : undefined;
  const toIso = toApplied ? dateToEndIso(toApplied) : undefined;

  const history = useBrokerClientHistory(clientId, {
    instrument: instrumentApplied || undefined,
    from: fromIso,
    to: toIso,
    page,
    pageSize: PAGE_SIZE,
  });

  const items = history.data?.items ?? EMPTY_INCOMING_ITEMS;
  const total = history.data?.total ?? 0;
  const totalPages = Math.max(1, history.data?.totalPages ?? 1);

  const displayName = useMemo(() => {
    const fromRow = items.find((r) => r.clientName?.trim());
    return fromRow?.clientName?.trim() || initialDisplayName?.trim() || null;
  }, [items, initialDisplayName]);

  const title = displayName ?? t("unknownClient");
  const idShort = clientId.replace(/-/g, "").slice(0, 8);

  const stats = useMemo(() => summarizeClientTradeRows(items), [items]);
  const statsArePartial = total > 0 && items.length < total;

  function onApplyFilters() {
    let from = fromDraft;
    let to = toDraft;
    if (from && to) {
      const a = new Date(`${from}T00:00:00`).getTime();
      const b = new Date(`${to}T00:00:00`).getTime();
      if (!Number.isNaN(a) && !Number.isNaN(b) && a > b) {
        const tmp = from;
        from = to;
        to = tmp;
        setFromDraft(from);
        setToDraft(to);
      }
    }
    setFromApplied(from);
    setToApplied(to);
    setInstrumentApplied(instrumentDraft.trim());
    setPage(1);
  }

  function clearFilters() {
    setInstrumentDraft("");
    setFromDraft("");
    setToDraft("");
    setInstrumentApplied("");
    setFromApplied("");
    setToApplied("");
    setPage(1);
  }

  const hasActiveFilters =
    Boolean(instrumentApplied) || Boolean(fromApplied) || Boolean(toApplied);

  if (history.isError) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {getApiErrorMessage(history.error)}
      </p>
    );
  }

  const loading = history.isLoading;
  const empty = !loading && total === 0;

  return (
    <div className="space-y-6">
      <nav className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
        <Link
          href="/dashboard/broker/clients"
          className="hover:text-foreground"
        >
          {t("breadcrumbClients")}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-foreground font-medium">{title}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {title}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("historySubtitle")}
          </p>
        </div>
        <Badge
          variant="secondary"
          className="border-sky-500/20 bg-sky-500/10 text-sky-900 w-fit shrink-0 font-mono text-xs font-medium"
        >
          {t("idBadge", { id: idShort })}
        </Badge>
      </div>

      <Card className="shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="client-history-instrument">
                {t("filterInstrument")}
              </Label>
              <div className="relative">
                <Search
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  aria-hidden
                />
                <Input
                  id="client-history-instrument"
                  className="pl-9"
                  placeholder={t("filterInstrumentPlaceholder")}
                  value={instrumentDraft}
                  onChange={(e) => setInstrumentDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onApplyFilters();
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-history-from">{t("filterFrom")}</Label>
              <Input
                id="client-history-from"
                type="date"
                value={fromDraft}
                onChange={(e) => setFromDraft(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-history-to">{t("filterTo")}</Label>
              <Input
                id="client-history-to"
                type="date"
                value={toDraft}
                onChange={(e) => setToDraft(e.target.value)}
              />
            </div>
            <Button
              type="button"
              className="w-full md:w-auto"
              onClick={onApplyFilters}
            >
              {t("applyFilters")}
            </Button>
          </div>

          {hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-2 border-t pt-4">
              <span className="text-muted-foreground text-xs font-medium">
                {t("activeFilters")}
              </span>
              {instrumentApplied ? (
                <Badge variant="secondary" className="gap-1 pr-1 font-normal">
                  {t("chipInstrument", { value: instrumentApplied })}
                  <button
                    type="button"
                    className="hover:bg-muted rounded p-0.5"
                    onClick={() => {
                      setInstrumentApplied("");
                      setInstrumentDraft("");
                      setPage(1);
                    }}
                    aria-label={t("removeInstrumentFilter")}
                  >
                    <X className="size-3.5" />
                  </button>
                </Badge>
              ) : null}
              {fromApplied || toApplied ? (
                <Badge variant="secondary" className="gap-1 pr-1 font-normal">
                  {t("chipDates", {
                    from: fromApplied || "—",
                    to: toApplied || "—",
                  })}
                  <button
                    type="button"
                    className="hover:bg-muted rounded p-0.5"
                    onClick={() => {
                      setFromApplied("");
                      setToApplied("");
                      setFromDraft("");
                      setToDraft("");
                      setPage(1);
                    }}
                    aria-label={t("removeDateFilter")}
                  >
                    <X className="size-3.5" />
                  </button>
                </Badge>
              ) : null}
              <button
                type="button"
                className="text-primary text-xs font-semibold hover:underline"
                onClick={clearFilters}
              >
                {t("clearFilters")}
              </button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-muted-foreground text-sm">{t("loadingHistory")}</p>
      ) : empty ? (
        <Card className="border-dashed shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
              <History className="size-7" aria-hidden />
            </span>
            <h2 className="text-lg font-semibold tracking-tight">
              {t("emptyTitle")}
            </h2>
            <p className="text-muted-foreground max-w-md text-sm">
              {t("emptyDescription")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
              {t("showingTotalRequests", { count: total })}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-medium">
                {t("totalBuy", { count: stats.buy })}
              </Badge>
              <Badge variant="secondary" className="font-medium">
                {t("totalSell", { count: stats.sell })}
              </Badge>
              <Badge
                variant="secondary"
                className="border-emerald-500/25 bg-emerald-500/10 text-emerald-900 font-medium"
              >
                {t("filled", { count: stats.filled })}
              </Badge>
              <Badge
                variant="secondary"
                className="border-red-500/25 bg-red-500/10 text-red-900 font-medium"
              >
                {t("rejected", { count: stats.rejected })}
              </Badge>
            </div>
          </div>
          {statsArePartial ? (
            <p className="text-muted-foreground text-xs">
              {t("statsPartialHint")}
            </p>
          ) : null}

          <Card className="overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr className="border-border border-b">
                    <th className="px-4 py-3 text-left font-medium">
                      {t("colDate")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      {t("colInstrument")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      {t("colType")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      {t("colQty")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      {t("colDesiredPrice")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      {t("colStatus")}
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      {t("colAction")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => {
                    const intent = intentPill(row.kind);
                    return (
                      <tr
                        key={row.id}
                        className="border-border hover:bg-muted/25 border-b transition-colors"
                      >
                        <td className="text-muted-foreground px-4 py-3 tabular-nums">
                          <span className="text-foreground md:hidden">
                            {fmtDateTime(row.createdAt)}
                          </span>
                          <span className="text-foreground hidden md:inline">
                            {fmtDate(row.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">
                            {row.instrumentName ?? row.ticker ?? "—"}
                          </p>
                          {row.ticker ? (
                            <p className="text-muted-foreground mt-0.5 text-xs uppercase">
                              {row.ticker}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                              intent.className,
                            )}
                          >
                            {t(intent.labelKey)}
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {fmtQty(row.quantity)}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {fmtMoney(row.desiredPrice, row.currency)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
                              statusPillClass(row.status),
                            )}
                          >
                            {row.status ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={requestDetailHref(row)}
                            className="text-primary text-sm font-semibold hover:underline"
                          >
                            {t("viewDetails")}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
              <p className="text-muted-foreground text-sm">
                {t("pageOf", { page, totalPages })}
              </p>
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label={t("previousPage")}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {totalPages <= 10
                  ? Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (n) => (
                        <Button
                          key={n}
                          type="button"
                          variant={n === page ? "default" : "outline"}
                          size="sm"
                          className="min-w-9"
                          onClick={() => setPage(n)}
                        >
                          {n}
                        </Button>
                      ),
                    )
                  : null}
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label={t("nextPage")}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
