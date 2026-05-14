"use client";

import { useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, CheckCircle2, Download, Loader2, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { useBrokerDirectory } from "@/features/profiles/api/use-broker-directory";
import { institutionInitials } from "@/features/brokers/lib/filter-brokers";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { tradeStatusBadgeClassName } from "@/features/investor/lib/request-status-presentational";
import { formatTradeRequestCalendarDate } from "@/features/investor/lib/format-trade-request-date";
import {
  useInvestorBuyRequestDetail,
  useInvestorSellRequestDetail,
} from "@/features/investor/api/use-investor-trade-request-detail";
import { InvestorRequestNegotiationView } from "@/features/investor/components/investor-request-negotiation-view";

type Kind = "buy" | "sell";

function displayRequestCode(id: string): string {
  const compact = id.replace(/-/g, "");
  const tail = compact.slice(-5).toUpperCase();
  return `REQ-${tail}`;
}

function estimatedNotional(
  qty: number,
  price: number | null | undefined,
): number | null {
  if (price == null) return null;
  return qty * price;
}

export function InvestorRequestDetailView({
  kind,
  id,
}: {
  kind: Kind;
  id: string;
}) {
  const { data: session } = useSession();
  const t = useTranslations("investor.requestDetail");
  const tStatus = useTranslations("investor.requests.status");
  const tType = useTranslations("investor.dashboard.requestType");
  const isActivated = Boolean(session?.user?.isActivated);

  const resolveStatus = useCallback(
    (raw: string | null | undefined) => {
      if (!raw) return "—";
      if (tStatus.has(raw)) return tStatus(raw);
      return raw;
    },
    [tStatus],
  );

  const buyQ = useInvestorBuyRequestDetail(id, isActivated && kind === "buy");
  const sellQ = useInvestorSellRequestDetail(
    id,
    isActivated && kind === "sell",
  );
  const q = kind === "buy" ? buyQ : sellQ;

  const { data: brokers } = useBrokerDirectory();

  const detail = q.data;
  const request = detail?.request;

  const brokerLabel = useMemo(() => {
    if (!request?.brokerId) return null;
    const fromApi =
      request.brokerInstitution?.trim() || request.brokerName?.trim();
    if (fromApi) return fromApi;
    const b = brokers?.find((x) => x.userId === request.brokerId);
    return b?.institution?.trim() || b?.fullName?.trim() || null;
  }, [brokers, request]);

  const brokerInitials = useMemo(() => {
    if (brokerLabel) return institutionInitials(brokerLabel);
    return "BR";
  }, [brokerLabel]);

  const sortedHistory = useMemo(() => {
    const h = detail?.history ?? [];
    return [...h].sort(
      (a, b) =>
        new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    );
  }, [detail?.history]);

  const timelineRows = useMemo(() => {
    if (!request) return [];
    const rows: {
      key: string;
      titleKey: string;
      desc: string;
      at: string;
      dotClass: string;
    }[] = [];

    rows.push({
      key: "submitted",
      titleKey: "timelineSubmitted",
      desc: t("timelineSubmittedDesc"),
      at: request.createdAt,
      dotClass: "bg-primary",
    });

    for (const entry of sortedHistory) {
      const st = entry.toStatus?.trim() || "Update";
      const titleKey = `historyTitle.${st}`;
      rows.push({
        key: entry.id,
        titleKey,
        desc:
          entry.notes?.trim() ||
          t("historyFallback", { status: resolveStatus(st) }),
        at: entry.occurredAt,
        dotClass:
          st === "Filled"
            ? "bg-emerald-500"
            : st === "Rejected" || st === "Cancelled"
              ? "bg-destructive"
              : "bg-primary",
      });
    }
    return rows;
  }, [request, sortedHistory, t, resolveStatus]);

  const latestProposal = useMemo(() => {
    const list = detail?.proposals ?? [];
    if (!list.length) return null;
    const accepted = list.find((p) => p.status === "Accepted");
    if (accepted) return accepted;
    return [...list].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
  }, [detail?.proposals]);

  const lastFill = useMemo(() => {
    const rev = [...sortedHistory].reverse();
    return rev.find(
      (e) => e.toStatus === "Filled" || e.toStatus === "PartiallyFilled",
    );
  }, [sortedHistory]);

  const pendingClientProposal = useMemo(() => {
    const list = detail?.proposals ?? [];
    const pend = list.filter((p) => p.status === "Pending");
    if (!pend.length) return null;
    return [...pend].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
  }, [detail?.proposals]);

  const status = request?.status ?? null;
  const isFilled = status === "Filled";

  if (!isActivated) {
    return (
      <p className="text-muted-foreground text-sm">{t("needActivation")}</p>
    );
  }

  if (q.isLoading) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center gap-2 text-sm">
        <Loader2 className="size-6 animate-spin" aria-hidden />
        {t("loading")}
      </div>
    );
  }

  if (q.isError || !request) {
    return (
      <div className="border-border/80 bg-card mx-auto max-w-lg space-y-4 rounded-2xl border p-8 text-center">
        <p className="text-destructive text-sm">
          {getApiErrorMessage(q.error) || t("notFound")}
        </p>
        <Link
          href="/requests"
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}
        >
          {t("backToList")}
        </Link>
      </div>
    );
  }

  const instrument =
    request.instrumentName?.trim() || request.ticker?.trim() || "—";
  const ticker = request.ticker?.trim();
  const qty = request.quantity;
  const target = request.desiredPrice;
  const cur = request.currency?.trim() || "ETB";
  const notional = estimatedNotional(qty, target);

  if (pendingClientProposal && detail) {
    return (
      <InvestorRequestNegotiationView
        kind={kind}
        detail={detail}
        brokerLabel={brokerLabel}
        onRefetch={() => {
          void q.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/requests"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToList")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
              {t("heading", { code: displayRequestCode(request.id) })}
            </h1>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                tradeStatusBadgeClassName(status),
              )}
            >
              {isFilled ? (
                <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
              ) : null}
              {resolveStatus(status)}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            {instrument}
            {ticker ? ` (${ticker})` : ""}
            {" · "}
            <span className="text-primary font-medium">{tType(kind)}</span>
            {" · "}
            {t("subheadingQty", {
              qty: Number.isInteger(qty)
                ? qty.toLocaleString()
                : qty.toLocaleString(undefined, { maximumFractionDigits: 2 }),
            })}
          </p>
        </div>
        <button
          type="button"
          disabled
          title={t("receiptDisabledHint")}
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "h-11 gap-2 rounded-lg border font-semibold shadow-none disabled:opacity-60",
          )}
        >
          <Download className="size-4" aria-hidden />
          {t("downloadReceipt")}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="border-border/80 lg:col-span-3 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t("yourRequest")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <dl className="grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {t("fieldAsset")}
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
                <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {t("fieldType")}
                </dt>
                <dd className="text-primary mt-1 font-semibold">
                  {tType(kind)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {t("fieldQuantity")}
                </dt>
                <dd className="text-foreground mt-1 font-semibold tabular-nums">
                  {Number.isInteger(qty)
                    ? `${qty.toLocaleString()} ${t("sharesSuffix")}`
                    : `${qty.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${t("sharesSuffix")}`}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {t("fieldTargetPrice")}
                </dt>
                <dd className="text-foreground mt-1 font-semibold tabular-nums">
                  {target != null
                    ? `${target.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })} ${cur}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {t("fieldEstValue")}
                </dt>
                <dd className="text-foreground mt-1 font-semibold tabular-nums">
                  {notional != null
                    ? `${notional.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} ${cur}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {t("fieldSubmitted")}
                </dt>
                <dd className="text-foreground mt-1 font-semibold">
                  {formatTradeRequestCalendarDate(new Date(request.createdAt))}
                </dd>
              </div>
            </dl>

            <div>
              <h3 className="text-foreground mb-4 text-sm font-semibold">
                {t("activityTitle")}
              </h3>
              <ul className="relative space-y-0 pl-1">
                <div
                  className="bg-border absolute top-2 bottom-2 left-[7px] w-px"
                  aria-hidden
                />
                {timelineRows.map((row) => (
                  <li
                    key={row.key}
                    className="relative flex gap-4 pb-8 last:pb-0"
                  >
                    <div
                      className={cn(
                        "relative z-[1] mt-1.5 size-3.5 shrink-0 rounded-full ring-4 ring-card",
                        row.dotClass,
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-foreground font-semibold">
                          {t.has(row.titleKey)
                            ? t(row.titleKey)
                            : row.titleKey.startsWith("historyTitle.")
                              ? resolveStatus(
                                  row.titleKey.replace("historyTitle.", ""),
                                )
                              : row.titleKey}
                        </p>
                        <time
                          className="text-muted-foreground shrink-0 text-xs tabular-nums"
                          dateTime={row.at}
                        >
                          {formatTradeRequestCalendarDate(new Date(row.at))}
                          {", "}
                          {new Date(row.at).toLocaleTimeString(undefined, {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                        {row.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 lg:col-span-2 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t("brokerCardTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-start gap-3">
              <div
                className="bg-primary text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                aria-hidden
              >
                {brokerInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground font-semibold leading-tight">
                  {brokerLabel ?? t("brokerUnknown")}
                </p>
                <span className="border-primary/20 bg-primary/10 text-primary mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium">
                  <CheckCircle2 className="size-3" aria-hidden />
                  {t("premiumBroker")}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t pt-4">
              <span className="text-muted-foreground text-sm">
                {t("proposalStatusLabel")}
              </span>
              <span
                className={cn(
                  "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                  latestProposal?.status === "Accepted"
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                    : "border-border bg-muted/60 text-muted-foreground",
                )}
              >
                {latestProposal?.status
                  ? (() => {
                      switch (latestProposal.status) {
                        case "Accepted":
                          return t("proposalStatus.Accepted");
                        case "Pending":
                          return t("proposalStatus.Pending");
                        case "Rejected":
                          return t("proposalStatus.Rejected");
                        default:
                          return latestProposal.status;
                      }
                    })()
                  : t("proposalNone")}
              </span>
            </div>

            <ul className="text-foreground space-y-3 text-sm">
              <li className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {t("rowCommission")}
                </span>
                <span className="font-medium tabular-nums">—</span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-muted-foreground">{t("rowFees")}</span>
                <span className="font-medium tabular-nums">—</span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {t("rowExecution")}
                </span>
                <span className="text-right font-medium">
                  {t("rowExecutionT2")}
                </span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {t("rowFinalPrice")}
                </span>
                <span className="font-medium tabular-nums">
                  {lastFill?.actualPrice != null
                    ? `${lastFill.actualPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })} ${cur}`
                    : latestProposal?.proposedPrice != null
                      ? `${latestProposal.proposedPrice.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          },
                        )} ${cur}`
                      : "—"}
                </span>
              </li>
            </ul>

            {lastFill?.actualPrice != null && notional != null ? (
              <div className="border-sky-500/20 bg-sky-500/10 flex gap-3 rounded-lg border p-3">
                <Info className="text-primary mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="text-foreground text-sm font-semibold">
                    {t("settlementTitle")}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    {t("settlementBody", {
                      amount: (lastFill.actualPrice * qty).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      ),
                      currency: cur,
                    })}
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {isFilled ? (
        <div className="border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 flex items-start gap-3 rounded-xl border px-4 py-3.5 dark:border-emerald-500/25">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-300" />
          <p className="text-sm font-medium">{t("filledBanner")}</p>
        </div>
      ) : null}
    </div>
  );
}
