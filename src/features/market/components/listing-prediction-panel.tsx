"use client";

import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { useSecurityPrediction } from "@/features/market/api/use-security-prediction";
import { useGeneratePrediction } from "@/features/market/api/use-generate-prediction";
import { PredictionBadge } from "@/features/market/components/prediction-badge";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button, buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

type Props = {
  securityId: string;
  currency?: string | null;
  className?: string;
};

export function ListingPredictionPanel({
  securityId,
  currency,
  className,
}: Props) {
  const t = useTranslations("investor.listings");
  const predictionQuery = useSecurityPrediction(securityId);
  const generateMutation = useGeneratePrediction();

  const isLoading = predictionQuery.isLoading;
  const hasPrediction = predictionQuery.data != null;

  const generateError =
    generateMutation.isError && getApiErrorMessage(generateMutation.error);

  return (
    <div
      className={cn(
        "border-border/80 bg-muted/30 space-y-3 rounded-xl border p-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{t("predictionSectionTitle")}</p>
        <Link
          href={`/market/securities/${securityId}`}
          className={cn(
            buttonVariants({ variant: "link" }),
            "h-auto p-0 text-xs",
          )}
        >
          {t("viewSecurityDetail")}
        </Link>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {t("predictionLoading")}
        </div>
      ) : hasPrediction ? (
        <div className="space-y-3">
          <PredictionBadge
            prediction={predictionQuery.data!}
            currency={currency}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={generateMutation.isPending}
            onClick={() =>
              generateMutation.mutate({ securityId, forceRefresh: true })
            }
          >
            {generateMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="size-4" aria-hidden />
            )}
            {t("predictionRefresh")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {predictionQuery.isError
              ? getApiErrorMessage(predictionQuery.error)
              : t("predictionUnavailable")}
          </p>
          <Button
            type="button"
            size="sm"
            className="gap-2"
            disabled={generateMutation.isPending}
            onClick={() => generateMutation.mutate({ securityId })}
          >
            {generateMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="size-4" aria-hidden />
            )}
            {t("predictionGenerate")}
          </Button>
          {generateError ? (
            <p className="text-destructive text-xs" role="alert">
              {generateError}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
