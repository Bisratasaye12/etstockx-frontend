"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/utils";
import type { PredictionDto } from "@/features/market/model/prediction-types";

type Props = {
  prediction: PredictionDto;
  currency?: string | null;
  className?: string;
};

function formatMoney(price: number, currency: string | null | undefined) {
  const cur = (currency ?? "ETB").trim() || "ETB";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur.length === 3 ? cur : "ETB",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${price.toLocaleString()} ${cur}`;
  }
}

export function PredictionBadge({ prediction, currency, className }: Props) {
  const t = useTranslations("investor.listings");
  const isUp = prediction.direction.toLowerCase() === "up";
  const confidencePct = Math.round(prediction.confidenceScore * 100);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
        isUp
          ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100"
          : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100",
        className,
      )}
    >
      {isUp ? (
        <TrendingUp className="size-4 shrink-0" aria-hidden />
      ) : (
        <TrendingDown className="size-4 shrink-0" aria-hidden />
      )}
      <span>
        {t("predictionLabel", {
          direction: isUp ? t("predictionUp") : t("predictionDown"),
          price: formatMoney(prediction.predictedPrice, currency),
        })}
      </span>
      <span className="text-xs opacity-80">
        {t("predictionConfidence", { pct: confidencePct })}
      </span>
    </div>
  );
}
