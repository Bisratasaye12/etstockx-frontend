"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Info, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { browserApi } from "@/shared/api/browser-api";
import { investorKeys } from "@/features/investor/api/keys";
import type {
  BuyRequestDetailDto,
  SellRequestDetailDto,
} from "@/features/investor/model/types";
import { institutionInitials } from "@/features/brokers/lib/filter-brokers";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { tradeStatusBadgeClassName } from "@/features/investor/lib/request-status-presentational";
import {
  getTradeRequestDateParts,
  formatTradeRequestTime,
  formatTradeRequestCalendarDate,
} from "@/features/investor/lib/format-trade-request-date";

type Kind = "buy" | "sell";

type RequestDto =
  | BuyRequestDetailDto["request"]
  | SellRequestDetailDto["request"];

function displayRequestCode(id: string): string {
  const compact = id.replace(/-/g, "");
  const tail = compact.slice(-5).toUpperCase();
  return `REQ-${tail}`;
}

function formatMoney(n: number, currency: string): string {
  return `${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export function InvestorRequestNegotiationView({
  kind,
  detail,
  brokerLabel,
  onRefetch,
}: {
  kind: Kind;
  detail: BuyRequestDetailDto | SellRequestDetailDto;
  brokerLabel: string | null;
  onRefetch: () => void;
}) {
  const t = useTranslations("investor.requestNegotiation");
  const tStatus = useTranslations("investor.requests.status");
  const tType = useTranslations("investor.dashboard.requestType");
  const qc = useQueryClient();
  const [prevOpen, setPrevOpen] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const request = detail.request as RequestDto;
  const proposals = useMemo(() => detail.proposals ?? [], [detail.proposals]);
  const history = useMemo(() => detail.history ?? [], [detail.history]);

  const sortedAsc = useMemo(
    () =>
      [...proposals].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [proposals],
  );

  const proposalNumber = (id: string) => {
    const i = sortedAsc.findIndex((p) => p.id === id);
    return i >= 0 ? i + 1 : 1;
  };

  const pendingProposal = useMemo(() => {
    const pend = proposals.filter((p) => p.status === "Pending");
    return (
      [...pend].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0] ?? null
    );
  }, [proposals]);

  const previousProposals = useMemo(() => {
    if (!pendingProposal)
      return sortedAsc.filter((p) => p.status !== "Pending");
    return sortedAsc.filter((p) => p.id !== pendingProposal.id);
  }, [pendingProposal, sortedAsc]);

  const sortedHistory = useMemo(
    () =>
      [...history].sort(
        (a, b) =>
          new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
      ),
    [history],
  );

  const activityItems = useMemo(() => {
    type Item = {
      key: string;
      at: string;
      title: string;
      body: string;
      dot: "primary" | "destructive" | "muted";
    };
    const items: Item[] = [];
    items.push({
      key: "submitted",
      at: request.createdAt,
      title: t("activitySubmitted"),
      body: t("activitySubmittedBody"),
      dot: "muted",
    });
    for (const e of sortedHistory) {
      const st = e.toStatus?.trim() ?? "";
      const title =
        st === "ProposalSent"
          ? t("activityProposalSent")
          : st === "Rejected"
            ? t("activityRejected")
            : t("activityUpdate", { status: st || "—" });
      const body =
        e.notes?.trim() ||
        (st ? t("activityStatusBody", { status: st }) : t("activityGeneric"));
      const dot: Item["dot"] =
        st === "Rejected" || st === "Cancelled" ? "destructive" : "primary";
      items.push({
        key: e.id,
        at: e.occurredAt,
        title,
        body,
        dot,
      });
    }
    return items.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  }, [request, sortedHistory, t]);

  const cur = request.currency?.trim() || "ETB";
  const qty = request.quantity;
  const target = request.desiredPrice;
  const instrument =
    request.instrumentName?.trim() || request.ticker?.trim() || "—";
  const ticker = request.ticker?.trim();
  const notional = target != null ? qty * target : null;

  const offeredQty = pendingProposal?.proposedQuantity ?? null;
  const offeredPrice = pendingProposal?.proposedPrice ?? null;
  const qtyMatch = offeredQty != null && Math.abs(offeredQty - qty) < 0.0001;
  const priceDiff =
    offeredPrice != null && target != null ? offeredPrice - target : null;

  const estFees = offeredPrice != null ? qty * offeredPrice * 0.02 : null;
  const totalEst =
    offeredPrice != null ? qty * offeredPrice + (estFees ?? 0) : null;

  const confirmMutation = useMutation({
    mutationFn: async (accept: boolean) => {
      if (!pendingProposal) throw new Error("No proposal");
      await browserApi.post(
        `/v1/trade/proposals/${pendingProposal.id}/confirm`,
        {
          accept,
        },
      );
    },
    onSuccess: () => {
      setActionError(null);
      void qc.invalidateQueries({ queryKey: investorKeys.all });
      void onRefetch();
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err));
    },
  });

  const onAccept = () => confirmMutation.mutate(true);
  const onReject = () => {
    if (typeof window !== "undefined" && !window.confirm(t("rejectConfirm"))) {
      return;
    }
    confirmMutation.mutate(false);
  };

  const initials = institutionInitials(brokerLabel ?? "BR");

  function formatActivityWhen(iso: string): string {
    const d = new Date(iso);
    const parts = getTradeRequestDateParts(iso);
    const time = formatTradeRequestTime(d);
    if (parts.mode === "today") return `${t("dateToday")}, ${time}`;
    if (parts.mode === "yesterday") return `${t("dateYesterday")}, ${time}`;
    return `${formatTradeRequestCalendarDate(d)}, ${time}`;
  }

  const status = request.status ?? "";

  return (
    <div className="space-y-6">
      <Link
        href="/requests"
        className="text-primary inline-flex items-center gap-2 text-sm font-semibold hover:underline"
      >
        {t("back")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
            {t("title", { code: displayRequestCode(request.id) })}
          </h1>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
            tradeStatusBadgeClassName(status),
          )}
        >
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              status === "ProposalSent" || status === "BrokerReviewing"
                ? "bg-amber-500"
                : "bg-muted-foreground",
            )}
            aria-hidden
          />
          {tStatus.has(status) ? tStatus(status) : status}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="border-border/80 rounded-xl border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                {t("summaryTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {t("targetAsset")}
                  </dt>
                  <dd className="text-foreground mt-1 font-semibold">
                    {instrument}
                    {ticker ? (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        ({ticker})
                      </span>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {t("intent")}
                  </dt>
                  <dd className="text-foreground mt-1 font-semibold">
                    {tType(kind)} {t("sharesWord")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {t("qtyRequested")}
                  </dt>
                  <dd className="text-foreground mt-1 font-semibold tabular-nums">
                    {qty.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {t("targetPriceShare", { currency: cur })}
                  </dt>
                  <dd className="text-foreground mt-1 font-semibold tabular-nums">
                    {target != null
                      ? `${target.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${t("shareWord")}`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {t("totalTarget")}
                  </dt>
                  <dd className="text-foreground mt-1 font-semibold tabular-nums">
                    {notional != null ? formatMoney(notional, cur) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {t("dateSubmitted")}
                  </dt>
                  <dd className="text-foreground mt-1 font-semibold">
                    {formatTradeRequestCalendarDate(
                      new Date(request.createdAt),
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="border-border/80 rounded-xl border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                {t("timelineTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="relative space-y-0 pl-1">
                <div
                  className="bg-border absolute top-2 bottom-2 left-[7px] w-px"
                  aria-hidden
                />
                {activityItems.map((row) => (
                  <li
                    key={row.key}
                    className="relative flex gap-4 pb-8 last:pb-0"
                  >
                    <div
                      className={cn(
                        "relative z-[1] mt-1.5 size-3.5 shrink-0 rounded-full ring-4 ring-card",
                        row.dot === "destructive"
                          ? "bg-destructive"
                          : row.dot === "primary"
                            ? "bg-primary"
                            : "bg-muted-foreground/50",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <time
                        className="text-muted-foreground text-xs font-medium tabular-nums"
                        dateTime={row.at}
                      >
                        {formatActivityWhen(row.at)}
                      </time>
                      <p className="text-foreground mt-1 font-semibold">
                        {row.title}
                      </p>
                      <p className="text-muted-foreground mt-1 text-sm leading-relaxed whitespace-pre-wrap">
                        {row.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {pendingProposal ? (
            <div className="border-sky-500/25 bg-sky-500/10 flex gap-3 rounded-xl border px-4 py-3.5">
              <Info
                className="text-primary mt-0.5 size-5 shrink-0"
                aria-hidden
              />
              <div>
                <p className="text-foreground text-sm font-semibold">
                  {t("alertTitle")}
                </p>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  {t("alertBody", {
                    broker: brokerLabel ?? t("brokerFallback"),
                  })}
                </p>
              </div>
            </div>
          ) : null}

          {pendingProposal ? (
            <Card className="border-border/80 overflow-hidden rounded-xl border shadow-sm">
              <div className="border-border bg-muted/40 flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className="bg-muted text-muted-foreground flex size-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                    aria-hidden
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="text-foreground font-semibold">
                      {brokerLabel ?? t("brokerFallback")}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t("proposalN", {
                        n: proposalNumber(pendingProposal.id),
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-amber-700 dark:text-amber-200 text-sm font-semibold">
                  {t("pendingYourAction")}
                </span>
              </div>
              <CardContent className="space-y-5 pt-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase">
                      {t("offeredQty")}
                    </p>
                    <p className="text-foreground mt-1 flex flex-wrap items-baseline gap-2 font-semibold">
                      {offeredQty != null
                        ? `${offeredQty.toLocaleString()} ${t("sharesSuffix")}`
                        : "—"}
                      {qtyMatch ? (
                        <span className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                          ({t("match")})
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase">
                      {t("offeredPrice", { currency: cur })}
                    </p>
                    <p className="text-foreground mt-1 flex flex-wrap items-baseline gap-2 font-semibold tabular-nums">
                      {offeredPrice != null
                        ? `${offeredPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${t("shareWord")}`
                        : "—"}
                      {priceDiff != null && Math.abs(priceDiff) > 1e-9 ? (
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            priceDiff > 0
                              ? "text-destructive"
                              : "text-emerald-700 dark:text-emerald-300",
                          )}
                        >
                          ({priceDiff > 0 ? "+" : ""}
                          {priceDiff.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          {t("diffSuffix")})
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase">
                      {t("estFees")}
                    </p>
                    <p className="text-foreground mt-1 text-sm font-semibold tabular-nums">
                      {estFees != null
                        ? `${formatMoney(estFees, cur)} (${t("feePct")})`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase">
                      {t("totalEstCost")}
                    </p>
                    <p className="text-foreground mt-1 text-sm font-bold tabular-nums">
                      {totalEst != null ? formatMoney(totalEst, cur) : "—"}
                    </p>
                  </div>
                </div>
                {pendingProposal.notes?.trim() ? (
                  <div className="border-border bg-muted/30 rounded-lg border px-4 py-3 text-sm leading-relaxed">
                    <p className="text-muted-foreground italic">
                      &ldquo;{pendingProposal.notes.trim()}&rdquo;
                    </p>
                  </div>
                ) : null}

                {actionError ? (
                  <p className="text-destructive text-sm" role="alert">
                    {actionError}
                  </p>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={onReject}
                    disabled={confirmMutation.isPending}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "default" }),
                      "h-11 w-full rounded-lg font-semibold",
                    )}
                  >
                    {t("reject")}
                  </button>
                  <button
                    type="button"
                    onClick={onAccept}
                    disabled={confirmMutation.isPending}
                    className={cn(
                      buttonVariants({ variant: "default", size: "default" }),
                      "h-11 w-full rounded-lg font-semibold",
                    )}
                  >
                    {confirmMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      t("accept")
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {previousProposals.length > 0 ? (
            <Card className="border-border/80 rounded-xl border shadow-sm">
              <button
                type="button"
                onClick={() => setPrevOpen((o) => !o)}
                className="text-foreground flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold"
              >
                {t("previousTitle", { count: previousProposals.length })}
                <ChevronDown
                  className={cn(
                    "text-muted-foreground size-5 transition-transform",
                    prevOpen ? "rotate-180" : "",
                  )}
                  aria-hidden
                />
              </button>
              {prevOpen ? (
                <CardContent className="border-border space-y-3 border-t px-5 py-4">
                  {[...previousProposals]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    )
                    .map((p) => (
                      <div
                        key={p.id}
                        className="border-border rounded-lg border bg-card/50 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-foreground text-sm font-semibold">
                            {brokerLabel ?? t("brokerFallback")} —{" "}
                            {t("proposalN", { n: proposalNumber(p.id) })}
                          </p>
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-xs font-medium",
                              p.status === "Rejected"
                                ? "border-destructive/25 bg-destructive/10 text-destructive"
                                : p.status === "Accepted"
                                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                                  : "border-border bg-muted/60 text-muted-foreground",
                            )}
                          >
                            {p.status ?? "—"}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-2 text-xs">
                          {t("prevSummary", {
                            price:
                              p.proposedPrice?.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) ?? "—",
                            currency: cur,
                            qty: p.proposedQuantity?.toLocaleString() ?? "—",
                            date: formatTradeRequestCalendarDate(
                              new Date(p.createdAt),
                            ),
                          })}
                        </p>
                      </div>
                    ))}
                </CardContent>
              ) : null}
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
