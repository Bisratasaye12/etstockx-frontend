"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  useListingDetail,
  useModerateListing,
  useModerationQueue,
} from "@/features/admin/api/use-listing-moderation";
import {
  ModerationDecision,
  type ModerationDecisionCode,
} from "@/shared/api/dtos/admin-portal";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

const QUEUE_PAGE_SIZE = 50;

function formatDateTime(iso: string | undefined, locale: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ListingModerationPanel() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [queuePage, setQueuePage] = useState(1);
  const {
    data: queueData,
    error,
    isFetching,
  } = useModerationQueue(queuePage, QUEUE_PAGE_SIZE);
  const items = useMemo(() => queueData?.items ?? [], [queueData?.items]);
  const total = queueData?.total ?? 0;
  const totalPages = total > 0 ? Math.max(1, queueData?.totalPages ?? 1) : 0;
  const pageLabel = t("moderation.pageIndicator", {
    page: queuePage,
    totalPages: Math.max(totalPages, 1),
  });

  useEffect(() => {
    if (totalPages > 0 && queuePage > totalPages) {
      setQueuePage(totalPages);
    }
  }, [queuePage, totalPages]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decision, setDecision] = useState<ModerationDecisionCode>(
    ModerationDecision.Approved,
  );
  const [reason, setReason] = useState("");

  useEffect(() => {
    setDecision(ModerationDecision.Approved);
    setReason("");
  }, [selectedId]);

  useEffect(() => {
    if (!items.length) {
      setSelectedId(null);
      return;
    }
    setSelectedId((prev) => {
      if (prev && items.some((i) => i.id === prev)) return prev;
      return items[0]!.id;
    });
  }, [items]);

  const {
    data: detail,
    isLoading: detailLoading,
    error: detailError,
  } = useListingDetail(selectedId);

  const moderate = useModerateListing();

  const decisionOptions: {
    value: ModerationDecisionCode;
    label: string;
  }[] = useMemo(
    () => [
      {
        value: ModerationDecision.Approved,
        label: t("moderation.decisionApprove"),
      },
      {
        value: ModerationDecision.Rejected,
        label: t("moderation.decisionReject"),
      },
      {
        value: ModerationDecision.Hidden,
        label: t("moderation.decisionHidden"),
      },
      {
        value: ModerationDecision.Clarification,
        label: t("moderation.decisionClarify"),
      },
    ],
    [t],
  );

  const onSubmit = () => {
    if (!selectedId) return;
    moderate.mutate(
      {
        listingId: selectedId,
        body: {
          decision,
          reason: reason.trim() ? reason.trim() : null,
        },
      },
      {
        onSuccess: () => {
          setReason("");
        },
      },
    );
  };

  if (error) {
    return (
      <p className="text-destructive text-sm">{getApiErrorMessage(error)}</p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
      <Card className="min-h-[280px]">
        <CardHeader>
          <CardTitle>{t("moderation.queueTitle")}</CardTitle>
          <CardDescription>
            {total === 0
              ? t("moderation.emptyQueue")
              : t("moderation.pendingCount", { count: total })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {items.length === 0 ? (
              isFetching ? (
                <p className="text-muted-foreground text-sm">
                  {t("moderation.loadingQueue")}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t("moderation.emptyQueue")}
                </p>
              )
            ) : (
              <ul className="space-y-2">
                {items.map((row) => {
                  const active = row.id === selectedId;
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(row.id)}
                        className={cn(
                          "border-border hover:bg-muted/60 w-full rounded-lg border p-3 text-left text-sm transition-colors",
                          active && "border-primary ring-primary/20 ring-2",
                        )}
                      >
                        <p className="font-medium">{row.instrumentName}</p>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {row.brokerInstitution ?? row.brokerName ?? "—"}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {row.sector ?? "—"} ·{" "}
                          {formatDateTime(row.createdAt, locale)}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {totalPages > 1 ? (
            <div className="border-border flex items-center justify-center gap-3 border-t pt-3">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={t("moderation.previousPage")}
                disabled={queuePage <= 1 || isFetching}
                onClick={() => setQueuePage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-muted-foreground text-sm">{pageLabel}</span>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={t("moderation.nextPage")}
                disabled={queuePage >= totalPages || isFetching}
                onClick={() => setQueuePage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("moderation.detailTitle")}</CardTitle>
          <CardDescription>
            {!selectedId
              ? t("moderation.selectListing")
              : detailLoading
                ? t("moderation.loadingDetail")
                : (detail?.instrumentName ?? "—")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {detailError ? (
            <p className="text-destructive text-sm">
              {getApiErrorMessage(detailError)}
            </p>
          ) : null}

          {selectedId && detail && !detailLoading ? (
            <>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">
                    {t("moderation.status")}
                  </dt>
                  <dd className="font-medium">{detail.status ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    {t("moderation.broker")}
                  </dt>
                  <dd className="font-medium">
                    {detail.brokerInstitution ?? detail.brokerName ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    {t("moderation.ticker")}
                  </dt>
                  <dd className="font-mono text-xs">{detail.ticker ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    {t("moderation.sector")}
                  </dt>
                  <dd>{detail.sector ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    {t("moderation.price")}
                  </dt>
                  <dd>
                    {detail.price.toLocaleString(locale)} {detail.currency}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    {t("moderation.quantity")}
                  </dt>
                  <dd>{detail.quantity.toLocaleString(locale)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">
                    {t("moderation.notes")}
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap">
                    {detail.notes?.trim() ? detail.notes : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    {t("moderation.validFrom")}
                  </dt>
                  <dd>{detail.validFrom ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    {t("moderation.validTo")}
                  </dt>
                  <dd>{detail.validTo ?? "—"}</dd>
                </div>
              </dl>

              <div className="space-y-3">
                <Label className="text-base">
                  {t("moderation.decisionTitle")}
                </Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {decisionOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className={cn(
                        "border-border flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm",
                        decision === opt.value && "border-primary bg-primary/5",
                      )}
                    >
                      <input
                        type="radio"
                        name="moderation-decision"
                        className="accent-primary"
                        checked={decision === opt.value}
                        onChange={() => setDecision(opt.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mod-reason">
                  {t("moderation.reasonLabel")}
                </Label>
                <Textarea
                  id="mod-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t("moderation.reasonPlaceholder")}
                />
              </div>

              {moderate.isError ? (
                <p className="text-destructive text-sm">
                  {getApiErrorMessage(moderate.error)}
                </p>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={onSubmit}
                  disabled={moderate.isPending || !selectedId}
                >
                  {moderate.isPending
                    ? t("moderation.submitting")
                    : t("moderation.submit")}
                </Button>
              </div>
            </>
          ) : selectedId && detailLoading ? (
            <p className="text-muted-foreground text-sm">
              {t("moderation.loadingDetail")}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              {t("moderation.selectListing")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
