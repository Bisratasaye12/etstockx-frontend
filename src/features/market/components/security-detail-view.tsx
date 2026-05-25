"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { useSecurityDetail } from "@/features/market/api/use-security-detail";
import { useSecurityPriceHistory } from "@/features/market/api/use-security-price-history";
import { ListingPredictionPanel } from "@/features/market/components/listing-prediction-panel";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

type Props = { securityId: string };

function formatMoney(price: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.length === 3 ? currency : "ETB",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${price.toLocaleString()} ${currency}`;
  }
}

export function SecurityDetailView({ securityId }: Props) {
  const t = useTranslations("investor.securities");
  const detail = useSecurityDetail(securityId);
  const history = useSecurityPriceHistory(securityId, 60, Boolean(detail.data));

  if (detail.isLoading) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center gap-2">
        <Loader2 className="size-6 animate-spin" aria-hidden />
      </div>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <div className="border-border/80 bg-card mx-auto max-w-lg space-y-4 rounded-2xl border p-8 text-center">
        <p className="text-destructive text-sm">
          {getApiErrorMessage(detail.error) || t("loadError")}
        </p>
        <Link
          href="/market/securities"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("backToCatalog")}
        </Link>
      </div>
    );
  }

  const s = detail.data;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <Link
        href="/market/securities"
        className="text-muted-foreground hover:text-foreground text-sm font-medium"
      >
        ← {t("backToCatalog")}
      </Link>

      <header className="space-y-2">
        <p className="font-mono text-sm font-semibold tracking-wide text-violet-700 dark:text-violet-300">
          {s.ticker}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{s.name}</h1>
        <p className="text-muted-foreground text-sm">
          {s.sector ?? "—"} · {s.status}
          {s.isin ? ` · ISIN ${s.isin}` : ""}
        </p>
        {s.referencePrice != null ? (
          <p className="text-lg font-semibold tabular-nums">
            {t("referencePrice")}:{" "}
            {formatMoney(s.referencePrice, s.referenceCurrency)}
          </p>
        ) : null}
      </header>

      <ListingPredictionPanel
        securityId={securityId}
        currency={s.referenceCurrency}
      />

      <section className="border-border/80 bg-card rounded-2xl border shadow-sm">
        <div className="border-border border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{t("priceHistoryTitle")}</h2>
          <p className="text-muted-foreground text-sm">
            {t("priceHistoryHint")}
          </p>
        </div>
        {history.isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 p-6 text-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t("historyLoading")}
          </div>
        ) : (history.data?.length ?? 0) === 0 ? (
          <p className="text-muted-foreground p-6 text-sm">
            {t("historyEmpty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-border text-muted-foreground border-b">
                  <th className="px-6 py-3 font-medium">{t("colDate")}</th>
                  <th className="px-6 py-3 font-medium">{t("colPrice")}</th>
                  <th className="px-6 py-3 font-medium">{t("colVolume")}</th>
                  <th className="px-6 py-3 font-medium">{t("colSource")}</th>
                </tr>
              </thead>
              <tbody>
                {history.data!.map((row) => (
                  <tr
                    key={row.id}
                    className="border-border/60 border-b last:border-0"
                  >
                    <td className="text-muted-foreground px-6 py-2.5 tabular-nums">
                      {new Date(row.recordedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-2.5 font-medium tabular-nums">
                      {formatMoney(row.price, s.referenceCurrency)}
                    </td>
                    <td className="px-6 py-2.5 tabular-nums">
                      {row.volume.toLocaleString()}
                    </td>
                    <td className="text-muted-foreground px-6 py-2.5 text-xs">
                      {row.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/market?securityId=${encodeURIComponent(securityId)}`}
          className={cn(buttonVariants({ variant: "default" }))}
        >
          {t("browseListings")}
        </Link>
      </div>
    </div>
  );
}
