"use client";

import {
  Building2,
  CheckCircle2,
  Hourglass,
  List,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { useBrokerSummary } from "@/features/broker/api/use-broker-summary";
import { useBrokerIncomingRequests } from "@/features/broker/api/use-broker-incoming-requests";
import type { IncomingRequestDto } from "@/features/broker/model/types";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";

function fmtNumber(value: number | undefined) {
  return Intl.NumberFormat("en-US").format(value ?? 0);
}

function fmtMoney(
  value: number | null | undefined,
  currency: string | null | undefined,
) {
  if (value == null || Number.isNaN(value)) return "—";
  const cur = currency?.trim() || "ETB";
  return `${cur} ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizeStatus(status: string | null | undefined) {
  return (status ?? "").toLowerCase().replace(/\s+/g, "");
}

function isNegotiationStatus(status: string | null | undefined) {
  return normalizeStatus(status).includes("negotiat");
}

function statusPillClass(status: string | null | undefined) {
  const n = normalizeStatus(status);
  if (n.includes("pending") || n.includes("review")) {
    return {
      wrap: "bg-red-500/10 text-red-700 border-red-500/20",
      dot: "bg-red-500",
    };
  }
  if (n.includes("negotiat")) {
    return {
      wrap: "bg-amber-500/12 text-amber-800 border-amber-500/25",
      dot: "bg-amber-500",
    };
  }
  return {
    wrap: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  };
}

function displayIntent(
  kind: string | null | undefined,
  labels: { intentBuy: string; intentSell: string },
) {
  const k = (kind ?? "").toLowerCase();
  if (k.includes("sell"))
    return { label: labels.intentSell, className: "text-red-600 font-medium" };
  return { label: labels.intentBuy, className: "text-emerald-600 font-medium" };
}

function StatCard({
  title,
  value,
  hint,
  hintClassName,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  hintClassName?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card size="sm" className="border-border/80 shadow-sm">
      <CardContent className="flex flex-col gap-3 pt-4">
        <div className="text-muted-foreground flex items-center justify-between gap-2 text-[11px] font-semibold tracking-wide uppercase">
          <span>{title}</span>
          <Icon
            className="text-muted-foreground size-4 shrink-0 opacity-80"
            aria-hidden
          />
        </div>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <p className={cn("text-xs", hintClassName)}>{hint}</p>
      </CardContent>
    </Card>
  );
}

function ActionRow({
  item,
  requestHref,
  labels,
}: {
  item: IncomingRequestDto;
  requestHref: string;
  labels: {
    intentBuy: string;
    intentSell: string;
    review: string;
    counter: string;
  };
}) {
  const intent = displayIntent(item.kind, labels);
  const pills = statusPillClass(item.status);
  const negotiation = isNegotiationStatus(item.status);

  return (
    <tr className="border-border hover:bg-muted/25 border-b transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Building2 className="text-muted-foreground size-4" aria-hidden />
          </span>
          <span className="font-medium">
            {item.instrumentName ?? item.ticker ?? "—"}
          </span>
        </div>
      </td>
      <td className={cn("px-4 py-3", intent.className)}>{intent.label}</td>
      <td className="text-muted-foreground px-4 py-3 tabular-nums">
        {fmtNumber(item.quantity)}
      </td>
      <td className="px-4 py-3 tabular-nums">
        {fmtMoney(item.desiredPrice, item.currency)}
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
            pills.wrap,
          )}
        >
          <span className={cn("size-1.5 shrink-0 rounded-full", pills.dot)} />
          {item.status ?? "—"}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <Link href={requestHref}>
          <Button size="sm" variant={negotiation ? "outline" : "default"}>
            {negotiation ? labels.counter : labels.review}
          </Button>
        </Link>
      </td>
    </tr>
  );
}

export function BrokerDashboardOverview() {
  const t = useTranslations("broker.dashboard");
  const summary = useBrokerSummary();
  const incoming = useBrokerIncomingRequests(1, 8);

  if (summary.isLoading) {
    return <p className="text-muted-foreground text-sm">{t("loading")}</p>;
  }

  if (summary.isError) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {getApiErrorMessage(summary.error)}
      </p>
    );
  }

  const data = summary.data;
  if (!data) {
    return <p className="text-muted-foreground text-sm">{t("loading")}</p>;
  }
  const rows = incoming.data?.items ?? [];
  const tableError = incoming.isError;

  const rowLabels = {
    intentBuy: t("intentBuy"),
    intentSell: t("intentSell"),
    review: t("review"),
    counter: t("counter"),
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("overviewTitle")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("overviewSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-40" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          {t("marketOpen")}
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            title={t("pendingReview")}
            value={fmtNumber(data.pendingReview)}
            hint={t("pendingReviewHint")}
            hintClassName="font-medium text-amber-600"
            icon={Hourglass}
          />
          <StatCard
            title={t("inNegotiation")}
            value={fmtNumber(data.inNegotiation)}
            hint={t("inNegotiationHint")}
            hintClassName="text-muted-foreground"
            icon={MessageCircle}
          />
          <StatCard
            title={t("totalOpen")}
            value={fmtNumber(data.totalOpenRequests)}
            hint={t("totalOpenHint")}
            hintClassName="text-muted-foreground"
            icon={List}
          />
          <StatCard
            title={t("filledToday")}
            value={fmtNumber(data.filledToday)}
            hint={t("filledTodayHint")}
            hintClassName="text-emerald-600"
            icon={CheckCircle2}
          />
        </div>

        <Card
          className="border-violet-200/80 bg-violet-50/80 flex-1 shadow-sm dark:border-violet-900/40 dark:bg-violet-950/25 lg:max-w-md xl:max-w-lg"
          size="sm"
        >
          <CardContent className="flex h-full min-h-[220px] flex-col gap-3 pt-5">
            <Badge
              variant="secondary"
              className="w-fit bg-violet-600/15 text-violet-800 dark:text-violet-200"
            >
              {t("marketUpdateBadge")}
            </Badge>
            <h2 className="text-lg font-semibold tracking-tight">
              {t("marketUpdateTitle")}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("marketUpdateBody")}
            </p>
            <div className="mt-auto flex justify-end pt-2">
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="rounded-full shadow-sm"
                aria-label={t("marketUpdateAction")}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <div className="border-border flex flex-col gap-1 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {t("actionRequiredTitle")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("actionRequiredSubtitle")}
            </p>
          </div>
          <Link
            href="/dashboard/broker/requests"
            className="text-primary text-sm font-semibold hover:underline"
          >
            {t("viewAll")} →
          </Link>
        </div>
        <div className="overflow-x-auto">
          {tableError ? (
            <p className="text-destructive px-4 py-6 text-sm" role="alert">
              {getApiErrorMessage(incoming.error)}
            </p>
          ) : incoming.isLoading ? (
            <p className="text-muted-foreground px-4 py-8 text-sm">
              {t("loading")}
            </p>
          ) : (
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr className="border-border border-b">
                  <th className="px-4 py-3 text-left font-medium">
                    {t("tableAsset")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {t("tableIntent")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {t("tableVolume")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {t("tablePrice")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {t("tableStatus")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    {t("tableAction")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      className="text-muted-foreground px-4 py-10 text-center"
                      colSpan={6}
                    >
                      {t("emptyRequests")}
                    </td>
                  </tr>
                ) : (
                  rows.map((item) => (
                    <ActionRow
                      key={item.id}
                      item={item}
                      labels={rowLabels}
                      requestHref={`/dashboard/broker/requests/${item.id}?kind=${encodeURIComponent(item.kind ?? "Buy")}`}
                    />
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
