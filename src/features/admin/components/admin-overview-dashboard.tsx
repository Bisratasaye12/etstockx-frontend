"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowLeftRight,
  RefreshCw,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useAdminStats } from "@/features/admin/api/use-admin-stats";
import { AdminOverviewSkeleton } from "@/features/admin/components/admin-skeletons";
import type {
  RegistrationsTimeSeriesPointDto,
  StatsGranularity,
  StatusCountDto,
  TradeRequestsTimeSeriesPointDto,
} from "@/shared/api/dtos/admin-stats";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

const selectClassName =
  "h-9 rounded-md border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

function fmtInt(value: number | undefined, locale: string): string {
  return (value ?? 0).toLocaleString(locale);
}

function formatPeriodDate(
  value: string | undefined,
  locale: string,
  fallback: string,
): string {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(d);
}

function formatBucketLabel(
  value: string | undefined,
  locale: string,
  granularity: StatsGranularity,
): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  if (granularity === "month") {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      year: "numeric",
    }).format(d);
  }
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(d);
}

function humanizeEnum(value: string | null | undefined): string {
  if (!value?.trim()) return "—";
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
}

function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}) {
  return (
    <Card size="sm" className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {loading ? "—" : value}
        </p>
        {hint ? (
          <p className="text-muted-foreground text-xs leading-relaxed">
            {hint}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function HorizontalBarChart({
  items,
  formatLabel,
  emptyLabel,
  barClassName,
}: {
  items: { label: string; value: number }[];
  formatLabel?: (label: string) => string;
  emptyLabel: string;
  barClassName?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground border-border bg-muted/20 rounded-lg border border-dashed px-4 py-8 text-center text-sm">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const pct = Math.round((item.value / max) * 100);
        const label = formatLabel ? formatLabel(item.label) : item.label;
        return (
          <li key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-foreground font-medium">{label}</span>
              <span className="text-muted-foreground tabular-nums">
                {item.value}
              </span>
            </div>
            <div
              className="bg-muted h-2 w-full overflow-hidden rounded-full"
              role="presentation"
            >
              <div
                className={cn(
                  "bg-primary h-full rounded-full transition-all duration-500",
                  barClassName,
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function VerticalBar({
  heightPct,
  className,
}: {
  heightPct: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full rounded-t-sm transition-all duration-500",
        className,
      )}
      style={{ height: `${heightPct}%` }}
    />
  );
}

function RegistrationsChart({
  points,
  locale,
  granularity,
  emptyLabel,
}: {
  points: RegistrationsTimeSeriesPointDto[];
  locale: string;
  granularity: StatsGranularity;
  emptyLabel: string;
}) {
  const data = useMemo(
    () =>
      points.map((p) => ({
        label: formatBucketLabel(p.date, locale, granularity),
        value: p.count,
      })),
    [points, locale, granularity],
  );

  const max = Math.max(1, ...data.map((d) => d.value));

  if (data.length === 0) {
    return (
      <p className="text-muted-foreground border-border bg-muted/20 rounded-lg border border-dashed px-4 py-10 text-center text-sm">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="flex h-44 items-end gap-1.5 sm:gap-2">
      {data.map((d) => {
        const heightPct = Math.max(4, Math.round((d.value / max) * 100));
        return (
          <BarChartColumn
            key={d.label}
            label={d.label}
            valueLabel={d.value > 0 ? String(d.value) : ""}
            heightPct={heightPct}
            barClassName="bg-primary"
          />
        );
      })}
    </div>
  );
}

function BarChartColumn({
  label,
  valueLabel,
  heightPct,
  barClassName,
}: {
  label: string;
  valueLabel: string;
  heightPct: number;
  barClassName?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <span className="text-muted-foreground text-[10px] font-medium tabular-nums sm:text-xs">
        {valueLabel}
      </span>
      <div className="bg-muted flex h-36 w-full max-w-10 items-end overflow-hidden rounded-t-md rounded-b-sm">
        <VerticalBar heightPct={heightPct} className={barClassName} />
      </div>
      <span
        className="text-muted-foreground w-full truncate text-center text-[9px] leading-tight sm:text-[10px]"
        title={label}
      >
        {label}
      </span>
    </div>
  );
}

function TradeRequestsChart({
  points,
  locale,
  granularity,
  emptyLabel,
  buyLabel,
  sellLabel,
}: {
  points: TradeRequestsTimeSeriesPointDto[];
  locale: string;
  granularity: StatsGranularity;
  emptyLabel: string;
  buyLabel: string;
  sellLabel: string;
}) {
  const chartData = useMemo(
    () =>
      points.map((p) => ({
        label: formatBucketLabel(p.date, locale, granularity),
        buy: p.buyCount,
        sell: p.sellCount,
        total: p.totalCount,
      })),
    [points, locale, granularity],
  );

  const max = Math.max(1, ...chartData.map((d) => d.total));

  if (chartData.length === 0) {
    return (
      <p className="text-muted-foreground border-border bg-muted/20 rounded-lg border border-dashed px-4 py-10 text-center text-sm">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex h-44 items-end gap-1.5 sm:gap-2">
        {chartData.map((d) => {
          const buyPct = Math.max(2, Math.round((d.buy / max) * 100));
          const sellPct = Math.max(2, Math.round((d.sell / max) * 100));
          return (
            <div
              key={d.label}
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <div className="flex h-36 w-full max-w-10 items-end justify-center gap-0.5">
                <div className="bg-muted flex h-full w-1/2 max-w-4 items-end overflow-hidden rounded-t-sm">
                  <VerticalBar
                    heightPct={buyPct}
                    className="bg-emerald-500 w-full"
                  />
                </div>
                <div className="bg-muted flex h-full w-1/2 max-w-4 items-end overflow-hidden rounded-t-sm">
                  <VerticalBar
                    heightPct={sellPct}
                    className="bg-rose-500 w-full"
                  />
                </div>
              </div>
              <span
                className="text-muted-foreground w-full truncate text-center text-[9px] leading-tight sm:text-[10px]"
                title={`${d.label} — ${d.buy} buy, ${d.sell} sell`}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="bg-emerald-500 size-2.5 rounded-sm" aria-hidden />
          {buyLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="bg-rose-500 size-2.5 rounded-sm" aria-hidden />
          {sellLabel}
        </span>
      </div>
    </div>
  );
}

function StatusBreakdownTable({
  rows,
  locale,
  t,
  emptyLabel,
}: {
  rows: StatusCountDto[];
  locale: string;
  t: ReturnType<typeof useTranslations<"admin.overview">>;
  emptyLabel: string;
}) {
  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const type = (a.requestType ?? "").localeCompare(b.requestType ?? "");
        if (type !== 0) return type;
        return b.count - a.count;
      }),
    [rows],
  );

  if (sorted.length === 0) {
    return (
      <p className="text-muted-foreground border-border bg-muted/20 rounded-lg border border-dashed px-4 py-8 text-center text-sm">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className="bg-muted/40 border-b">
          <tr>
            <th className="text-muted-foreground px-4 py-3 font-medium">
              {t("table.type")}
            </th>
            <th className="text-muted-foreground px-4 py-3 font-medium">
              {t("table.status")}
            </th>
            <th className="text-muted-foreground px-4 py-3 text-right font-medium">
              {t("table.count")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {sorted.map((row, index) => {
            const type = (row.requestType ?? "").toLowerCase();
            const isBuy = type.includes("buy");
            return (
              <tr key={`${row.requestType}-${row.status}-${index}`}>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-normal",
                      isBuy
                        ? "border-emerald-500/30 text-emerald-700"
                        : "border-rose-500/30 text-rose-700",
                    )}
                  >
                    {isBuy ? t("requestType.buy") : t("requestType.sell")}
                  </Badge>
                </td>
                <td className="px-4 py-3">{humanizeEnum(row.status)}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {row.count.toLocaleString(locale)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AdminOverviewDashboard() {
  const t = useTranslations("admin.overview");
  const locale = useLocale();
  const [granularity, setGranularity] = useState<StatsGranularity>("day");

  const { data, isLoading, isError, error, refetch, isFetching } =
    useAdminStats({ granularity });

  const periodLabel = useMemo(() => {
    if (!data?.period) return null;
    const from = formatPeriodDate(data.period.from, locale, "—");
    const to = formatPeriodDate(data.period.to, locale, "—");
    const g = data.period.granularity ?? granularity;
    return t("periodRange", { from, to, granularity: g });
  }, [data?.period, locale, granularity, t]);

  const roleBars = useMemo(
    () =>
      (data?.usersByRole ?? []).map((r) => ({
        label: r.role ?? "Unknown",
        value: r.count,
      })),
    [data?.usersByRole],
  );

  const typeBars = useMemo(
    () =>
      (data?.requestsByType ?? []).map((r) => ({
        label: r.type ?? "unknown",
        value: r.count,
      })),
    [data?.requestsByType],
  );

  const formatRole = (role: string) => {
    const key = role.replace(/\s+/g, "");
    const known = [
      "Client",
      "Broker",
      "Dealer",
      "Admin",
      "SuperAdmin",
    ] as const;
    if (known.includes(key as (typeof known)[number])) {
      return t(`roles.${key}` as "roles.Client");
    }
    return humanizeEnum(role);
  };

  const formatRequestType = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes("buy")) return t("requestType.buy");
    if (lower.includes("sell")) return t("requestType.sell");
    return humanizeEnum(type);
  };

  if (isLoading && !data) {
    return <AdminOverviewSkeleton />;
  }

  const kpis = data?.kpis;

  const userKpis = [
    {
      key: "totalUsers",
      title: t("kpis.totalUsers"),
      hint: t("kpis.totalUsersHint"),
      value: fmtInt(kpis?.totalUsers, locale),
      icon: Users,
    },
    {
      key: "totalClients",
      title: t("kpis.totalClients"),
      hint: t("kpis.totalClientsHint"),
      value: fmtInt(kpis?.totalClients, locale),
      icon: Users,
    },
    {
      key: "activatedClients",
      title: t("kpis.activatedClients"),
      hint: t("kpis.activatedClientsHint"),
      value: fmtInt(kpis?.activatedClients, locale),
      icon: UserCheck,
    },
    {
      key: "totalBrokers",
      title: t("kpis.totalBrokers"),
      hint: t("kpis.totalBrokersHint"),
      value: fmtInt(kpis?.totalBrokers, locale),
      icon: Shield,
    },
    {
      key: "totalAdmins",
      title: t("kpis.totalAdmins"),
      hint: t("kpis.totalAdminsHint"),
      value: fmtInt(kpis?.totalAdmins, locale),
      icon: Shield,
    },
  ];

  const tradeKpis = [
    {
      key: "totalBuyRequests",
      title: t("kpis.totalBuyRequests"),
      hint: t("kpis.totalBuyRequestsHint"),
      value: fmtInt(kpis?.totalBuyRequests, locale),
      icon: TrendingUp,
    },
    {
      key: "totalSellRequests",
      title: t("kpis.totalSellRequests"),
      hint: t("kpis.totalSellRequestsHint"),
      value: fmtInt(kpis?.totalSellRequests, locale),
      icon: Activity,
    },
    {
      key: "openBuyRequests",
      title: t("kpis.openBuyRequests"),
      hint: t("kpis.openBuyRequestsHint"),
      value: fmtInt(kpis?.openBuyRequests, locale),
      icon: ArrowLeftRight,
    },
    {
      key: "openSellRequests",
      title: t("kpis.openSellRequests"),
      hint: t("kpis.openSellRequestsHint"),
      value: fmtInt(kpis?.openSellRequests, locale),
      icon: ArrowLeftRight,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-muted-foreground text-sm">
          {isLoading ? t("loadingPeriod") : (periodLabel ?? t("defaultPeriod"))}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className={selectClassName}
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as StatsGranularity)}
            aria-label={t("granularityLabel")}
          >
            <option value="day">{t("granularity.day")}</option>
            <option value="week">{t("granularity.week")}</option>
            <option value="month">{t("granularity.month")}</option>
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("size-4", isFetching && "animate-spin")}
              aria-hidden
            />
            {isFetching ? t("refreshing") : t("refresh")}
          </Button>
        </div>
      </div>

      {isError ? (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-destructive text-sm" role="alert">
              {getApiErrorMessage(error)}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
            >
              {t("retry")}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {t("sections.users")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {userKpis.map(({ key: cardKey, ...card }) => (
            <KpiCard key={cardKey} {...card} loading={isLoading} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {t("sections.trades")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tradeKpis.map(({ key: cardKey, ...card }) => (
            <KpiCard key={cardKey} {...card} loading={isLoading} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">
              {t("charts.registrationsTitle")}
            </CardTitle>
            <CardDescription>{t("charts.registrationsHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <RegistrationsChart
              points={data?.registrations ?? []}
              locale={locale}
              granularity={granularity}
              emptyLabel={t("charts.empty")}
            />
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">
              {t("charts.tradeRequestsTitle")}
            </CardTitle>
            <CardDescription>{t("charts.tradeRequestsHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <TradeRequestsChart
              points={data?.tradeRequests ?? []}
              locale={locale}
              granularity={granularity}
              emptyLabel={t("charts.empty")}
              buyLabel={t("requestType.buy")}
              sellLabel={t("requestType.sell")}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">
              {t("breakdown.usersByRole")}
            </CardTitle>
            <CardDescription>{t("breakdown.usersByRoleHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart
              items={roleBars}
              formatLabel={formatRole}
              emptyLabel={t("breakdown.empty")}
            />
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">
              {t("breakdown.requestsByType")}
            </CardTitle>
            <CardDescription>
              {t("breakdown.requestsByTypeHint")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart
              items={typeBars}
              formatLabel={formatRequestType}
              emptyLabel={t("breakdown.empty")}
              barClassName="bg-violet-500"
            />
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {t("breakdown.requestsByStatus")}
            </CardTitle>
            <CardDescription>
              {t("breakdown.requestsByStatusHint")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusBreakdownTable
              rows={data?.requestsByStatus ?? []}
              locale={locale}
              t={t}
              emptyLabel={t("breakdown.empty")}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
