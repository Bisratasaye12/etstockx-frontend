"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  Info,
  Loader2,
  Plus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import {
  formatBirrAmount,
  tradeStatusBadgeClassName,
} from "@/features/investor/lib/request-status-presentational";
import {
  getTradeRequestDateParts,
  formatTradeRequestTime,
  formatTradeRequestCalendarDate,
} from "@/features/investor/lib/format-trade-request-date";
import {
  statusFilterOptionsForTab,
  type TradeRequestStatusName,
} from "@/features/investor/lib/trade-request-status-query";
import {
  useInvestorTradeRequestsList,
  type InvestorTradeListRow,
} from "@/features/investor/api/use-investor-trade-requests-list";

type TabKey = "all" | "buy" | "sell";

function instrumentLabel(row: InvestorTradeListRow): string {
  return row.instrumentName?.trim() || row.ticker?.trim() || "";
}

export function InvestorRequestsPanel() {
  const { data: session } = useSession();
  const t = useTranslations("investor.requests");
  const tStatus = useTranslations("investor.requests.status");
  const tType = useTranslations("investor.dashboard.requestType");
  const isActivated = Boolean(session?.user?.isActivated);

  const [tab, setTab] = useState<TabKey>("all");
  const [draftInstrument, setDraftInstrument] = useState("");
  const deferredInstrument = useDeferredValue(draftInstrument);
  const [status, setStatus] = useState<TradeRequestStatusName | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fromIso = useMemo(() => {
    if (!dateFrom) return undefined;
    const [y, m, d] = dateFrom.split("-").map(Number);
    if (!y || !m || !d) return undefined;
    return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
  }, [dateFrom]);

  const toIso = useMemo(() => {
    if (!dateTo) return undefined;
    const [y, m, d] = dateTo.split("-").map(Number);
    if (!y || !m || !d) return undefined;
    return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
  }, [dateTo]);

  const listFilters = useMemo(
    () => ({
      instrument: deferredInstrument,
      status,
      fromIso,
      toIso,
    }),
    [deferredInstrument, status, fromIso, toIso],
  );

  const {
    mergedRows,
    buyTotal,
    sellTotal,
    allTotal,
    pendingProposalCount,
    isLoading,
    isError,
    error,
  } = useInvestorTradeRequestsList(isActivated, listFilters);

  const statusOptions = useMemo(() => statusFilterOptionsForTab(tab), [tab]);

  const visibleRows = useMemo(() => {
    if (tab === "all") return mergedRows;
    return mergedRows.filter((r) => r.kind === tab);
  }, [mergedRows, tab]);

  const firstProposalHref = useMemo(() => {
    const row = mergedRows.find((r) => r.status === "ProposalSent");
    if (!row) return null;
    return `/requests/${row.kind}/${row.id}`;
  }, [mergedRows]);

  function clearFilters() {
    setDraftInstrument("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
  }

  function formatListDate(iso: string): string {
    const parts = getTradeRequestDateParts(iso);
    if (parts.mode === "today") {
      return `${t("dateToday")}, ${formatTradeRequestTime(parts.at)}`;
    }
    if (parts.mode === "yesterday") {
      return t("dateYesterday");
    }
    return formatTradeRequestCalendarDate(parts.at);
  }

  function statusLabel(raw: string | null | undefined): string {
    if (!raw) return "—";
    if (tStatus.has(raw)) return tStatus(raw);
    return raw;
  }

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

  if (isError) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {getApiErrorMessage(error)}
      </p>
    );
  }

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
        <Link
          href="/requests/new"
          className={cn(
            buttonVariants({ variant: "default", size: "default" }),
            "h-11 shrink-0 gap-2 rounded-lg px-5 font-semibold shadow-sm",
          )}
        >
          <Plus className="size-4" aria-hidden />
          {t("newRequestCta")}
        </Link>
      </div>

      {pendingProposalCount > 0 ? (
        <div
          className="border-sky-500/20 bg-sky-500/10 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3.5"
          role="status"
        >
          <div className="flex min-w-0 items-start gap-3">
            <Info className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
            <p className="text-foreground text-sm font-medium">
              {t("proposalBanner", { count: pendingProposalCount })}
            </p>
          </div>
          {firstProposalHref ? (
            <Link
              href={firstProposalHref}
              className="text-primary shrink-0 text-sm font-semibold underline-offset-4 hover:underline"
            >
              {t("proposalBannerCta")}
            </Link>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-16 text-sm">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          {t("loading")}
        </div>
      ) : mergedRows.length === 0 ? (
        <div className="border-border bg-card rounded-xl border shadow-sm">
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
            <ClipboardList
              className="text-muted-foreground/60 size-14"
              aria-hidden
            />
            <p className="text-foreground text-lg font-semibold">
              {t("emptyTitle")}
            </p>
            <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
              {t("emptyBody")}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/market"
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "h-11 min-w-[160px] rounded-lg px-6 font-semibold",
                )}
              >
                {t("browseListings")}
              </Link>
              <Link
                href="/brokers"
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" }),
                  "bg-background h-11 min-w-[160px] rounded-lg px-6 font-semibold",
                )}
              >
                {t("findBrokers")}
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="border-border flex flex-wrap gap-6 border-b">
            {(
              [
                ["all", allTotal],
                ["buy", buyTotal],
                ["sell", sellTotal],
              ] as const
            ).map(([key, count]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  "-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors",
                  tab === key
                    ? "border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground border-transparent",
                )}
              >
                {key === "all"
                  ? t("tabAll", { count })
                  : key === "buy"
                    ? t("tabBuy", { count })
                    : t("tabSell", { count })}
              </button>
            ))}
          </div>

          <div className="border-border bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
            <label className="min-w-[180px] flex-1 space-y-1.5">
              <span className="text-muted-foreground text-xs font-medium">
                {t("filterInstrument")}
              </span>
              <Input
                value={draftInstrument}
                onChange={(e) => setDraftInstrument(e.target.value)}
                placeholder={t("filterInstrumentPlaceholder")}
                className="h-11 rounded-lg"
                aria-label={t("filterInstrument")}
              />
            </label>
            <label className="w-full min-w-[160px] space-y-1.5 sm:w-44">
              <span className="text-muted-foreground text-xs font-medium">
                {t("filterStatus")}
              </span>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    (e.target.value || "") as TradeRequestStatusName | "",
                  )
                }
                className="border-input bg-background text-foreground h-11 w-full rounded-lg border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label={t("filterStatus")}
              >
                <option value="">{t("filterStatusAll")}</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {tStatus(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="w-full min-w-[140px] space-y-1.5 sm:w-40">
              <span className="text-muted-foreground text-xs font-medium">
                {t("filterDateFrom")}
              </span>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-11 rounded-lg"
                aria-label={t("filterDateFrom")}
              />
            </label>
            <label className="w-full min-w-[140px] space-y-1.5 sm:w-40">
              <span className="text-muted-foreground text-xs font-medium">
                {t("filterDateTo")}
              </span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-11 rounded-lg"
                aria-label={t("filterDateTo")}
              />
            </label>
            <button
              type="button"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground h-11 shrink-0 self-end text-sm font-semibold underline-offset-4 hover:underline sm:ml-auto"
            >
              {t("clearFilters")}
            </button>
          </div>

          <div className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-muted/35 border-b">
                  <tr>
                    <th className="text-muted-foreground w-14 px-4 py-3.5 font-medium">
                      <span className="sr-only">{t("colType")}</span>
                    </th>
                    <th className="text-muted-foreground px-4 py-3.5 font-medium">
                      {t("colInstrument")}
                    </th>
                    <th className="text-muted-foreground px-4 py-3.5 font-medium tabular-nums">
                      {t("colQty")}
                    </th>
                    <th className="text-muted-foreground px-4 py-3.5 font-medium">
                      {t("colTargetPrice")}
                    </th>
                    <th className="text-muted-foreground px-4 py-3.5 font-medium whitespace-nowrap">
                      {t("colDate")}
                    </th>
                    <th className="text-muted-foreground px-4 py-3.5 font-medium">
                      {t("colStatus")}
                    </th>
                    <th className="text-muted-foreground px-4 py-3.5 text-right font-medium">
                      {t("colAction")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {visibleRows.map((row) => {
                    const name = instrumentLabel(row) || t("unnamed");
                    const href = `/requests/${row.kind}/${row.id}`;
                    const showReview = row.status === "ProposalSent";
                    return (
                      <tr key={`${row.kind}-${row.id}`} className="bg-card">
                        <td className="px-4 py-4">
                          {row.kind === "buy" ? (
                            <ArrowDownLeft
                              className="text-emerald-600 size-5"
                              aria-label={tType("buy")}
                            />
                          ) : (
                            <ArrowUpRight
                              className="text-amber-600 size-5"
                              aria-label={tType("sell")}
                            />
                          )}
                        </td>
                        <td className="text-foreground px-4 py-4 font-medium">
                          {name}
                        </td>
                        <td className="text-foreground px-4 py-4 tabular-nums">
                          {Number.isInteger(row.quantity)
                            ? row.quantity.toLocaleString()
                            : row.quantity.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}
                        </td>
                        <td className="text-foreground px-4 py-4 tabular-nums">
                          {row.desiredPrice != null
                            ? formatBirrAmount(row.desiredPrice)
                            : "—"}
                        </td>
                        <td className="text-muted-foreground px-4 py-4 whitespace-nowrap">
                          {formatListDate(row.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                              tradeStatusBadgeClassName(row.status),
                            )}
                          >
                            {statusLabel(row.status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {showReview ? (
                            <Link
                              href={href}
                              className={cn(
                                buttonVariants({
                                  variant: "default",
                                  size: "sm",
                                }),
                                "h-9 rounded-full px-4 font-semibold",
                              )}
                            >
                              {t("reviewProposal")}
                            </Link>
                          ) : (
                            <Link
                              href={href}
                              className="text-primary text-sm font-semibold underline-offset-4 hover:underline"
                            >
                              {t("view")}
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
