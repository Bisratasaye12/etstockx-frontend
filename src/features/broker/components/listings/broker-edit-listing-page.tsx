"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Info, Lock, Pause, X } from "lucide-react";
import { Link, useRouter } from "@/shared/i18n/routing";
import { useBrokerListingDetail } from "@/features/broker/api/use-broker-listing-detail";
import { useChangeListingStatus } from "@/features/broker/api/use-change-listing-status";
import { useUpdateBrokerListing } from "@/features/broker/api/use-update-broker-listing";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

interface Props {
  listingId: string;
}

type EditFormState = {
  instrumentName: string;
  ticker: string;
  sector: string;
  price: string;
  quantity: string;
  currency: string;
  notes: string;
};

function normalizeStatus(status: string | null | undefined) {
  return (status ?? "").trim() || "Unknown";
}

function isPendingModerationStatus(status: string | null | undefined) {
  return (status ?? "")
    .toLowerCase()
    .replace(/\s|_/g, "")
    .includes("pendingmoderation");
}

export function BrokerEditListingPage({ listingId }: Props) {
  const router = useRouter();
  const detail = useBrokerListingDetail(listingId, Boolean(listingId));
  const updateListing = useUpdateBrokerListing();
  const changeStatus = useChangeListingStatus();
  const [form, setForm] = useState<EditFormState>({
    instrumentName: "",
    ticker: "",
    sector: "",
    price: "",
    quantity: "",
    currency: "ETB",
    notes: "",
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!detail.data) return;
    setForm({
      instrumentName: detail.data.instrumentName ?? "",
      ticker: detail.data.ticker ?? "",
      sector: detail.data.sector ?? "",
      price: String(detail.data.price ?? ""),
      quantity: String(detail.data.quantity ?? ""),
      currency: detail.data.currency ?? "ETB",
      notes: detail.data.notes ?? "",
    });
  }, [detail.data]);

  const statusLabel = normalizeStatus(detail.data?.status);
  const isModerationLocked = isPendingModerationStatus(detail.data?.status);
  const isSubmitting = updateListing.isPending || changeStatus.isPending;
  const isDirty = useMemo(() => {
    if (!detail.data) return false;
    return (
      form.instrumentName !== (detail.data.instrumentName ?? "") ||
      form.ticker !== (detail.data.ticker ?? "") ||
      form.sector !== (detail.data.sector ?? "") ||
      form.price !== String(detail.data.price ?? "") ||
      form.quantity !== String(detail.data.quantity ?? "") ||
      form.currency !== (detail.data.currency ?? "ETB") ||
      form.notes !== (detail.data.notes ?? "")
    );
  }, [detail.data, form]);

  async function handleSave() {
    setFeedback(null);
    try {
      await updateListing.mutateAsync({
        listingId,
        body: {
          instrumentName: form.instrumentName.trim() || null,
          ticker: form.ticker.trim() || null,
          sector: form.sector.trim() || null,
          price: form.price.trim() ? Number(form.price) : null,
          quantity: form.quantity.trim() ? Number(form.quantity) : null,
          currency: form.currency.trim() || null,
          notes: form.notes.trim() || null,
          minLotSize: null,
          validFrom: null,
          validTo: null,
        },
      });
      setFeedback("Listing updated successfully.");
    } catch (error) {
      setFeedback(getApiErrorMessage(error));
    }
  }

  async function handleStatus(action: "pause" | "close") {
    setFeedback(null);
    try {
      await changeStatus.mutateAsync({ listingId, action });
      await detail.refetch();
      setFeedback(action === "pause" ? "Listing paused." : "Listing closed.");
    } catch (error) {
      setFeedback(getApiErrorMessage(error));
    }
  }

  if (detail.isLoading) {
    return <p className="text-muted-foreground text-sm">Loading listing…</p>;
  }

  if (detail.isError || !detail.data) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {getApiErrorMessage(detail.error)}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-2">
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm">
          <Link href="/dashboard/broker/listings" className="hover:underline">
            My Listings
          </Link>{" "}
          › <span className="text-foreground">Edit Listing</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Edit Listing</h1>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-muted-foreground text-lg">
            {detail.data.instrumentName ?? detail.data.ticker ?? "Listing"}
          </p>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
            {statusLabel}
          </span>
        </div>
      </div>

      <section className="space-y-2 border-b pb-5">
        <div className="border-border bg-background/80 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
          <div>
            <p className="text-xs font-semibold tracking-wide uppercase">
              Listing Status
            </p>
            <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              {statusLabel}
            </div>
          </div>
          {isModerationLocked ? (
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Info className="size-4" />
              Under admin review. Status controls unavailable.
            </p>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => void handleStatus("pause")}
                disabled={isSubmitting}
                className="text-amber-700"
              >
                <Pause className="size-4" />
                Pause Listing
              </Button>
              <Button
                variant="ghost"
                onClick={() => void handleStatus("close")}
                disabled={isSubmitting}
                className="text-destructive"
              >
                <X className="size-4" />
                Close Listing
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-5">
        <div className="border-border overflow-hidden rounded-lg border">
          <div className="bg-muted/35 flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-2xl font-medium">Listing Details</h2>
            {isModerationLocked ? (
              <span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
                <Lock className="size-4" />
                Read only
              </span>
            ) : null}
          </div>
          <div className="space-y-5 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="instrumentName">
                  {isModerationLocked ? "Company" : "Company / Asset"}
                </Label>
                <Input
                  id="instrumentName"
                  value={form.instrumentName}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      instrumentName: e.target.value,
                    }))
                  }
                  className="h-11"
                  readOnly={isModerationLocked}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticker">
                  {isModerationLocked ? "Ticker / Symbol" : "Listing Type"}
                </Label>
                <Input
                  id="ticker"
                  value={isModerationLocked ? form.ticker : "Sell Order"}
                  readOnly
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  {isModerationLocked ? "Total Shares Offered" : "Quantity *"}
                </Label>
                <Input
                  id="quantity"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, quantity: e.target.value }))
                  }
                  className="h-11"
                  readOnly={isModerationLocked}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price Per Share (ETB)</Label>
                <Input
                  id="price"
                  value={form.price}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, price: e.target.value }))
                  }
                  className="h-11"
                  readOnly={isModerationLocked}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">
                {isModerationLocked
                  ? "Seller Notes"
                  : "Broker Notes (internal)"}
              </Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="min-h-[120px]"
                readOnly={isModerationLocked}
              />
            </div>
          </div>
        </div>
      </section>

      {isModerationLocked ? (
        <div className="border-sky-200 bg-sky-50 text-sky-900 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Editing is not available while this listing is Pending Moderation.
        </div>
      ) : null}

      {feedback ? (
        <p className="text-sm" role="status">
          {feedback}
        </p>
      ) : null}

      {!isModerationLocked ? (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/broker/listings")}
            disabled={isSubmitting}
          >
            Discard Changes
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={isSubmitting || !isDirty}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Save Changes
            <Check className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
