"use client";

import { useMemo, useState } from "react";
import { CircleCheckBig, Clock3 } from "lucide-react";
import { useRouter } from "@/shared/i18n/routing";
import { usePublishBrokerListing } from "@/features/broker/api/use-publish-broker-listing";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Modal } from "@/shared/ui/modal";
import { Textarea } from "@/shared/ui/textarea";

type FormState = {
  instrumentName: string;
  ticker: string;
  sector: string;
  currency: string;
  price: string;
  quantity: string;
  minLotSize: string;
  validFrom: string;
  validTo: string;
  notes: string;
};

const initialState: FormState = {
  instrumentName: "",
  ticker: "",
  sector: "Banking",
  currency: "ETB",
  price: "",
  quantity: "",
  minLotSize: "",
  validFrom: "",
  validTo: "",
  notes: "",
};

export function BrokerNewListingPage() {
  const router = useRouter();
  const publish = usePublishBrokerListing();
  const [form, setForm] = useState<FormState>(initialState);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedInstrumentName, setSubmittedInstrumentName] = useState("");

  const isComplete = useMemo(() => {
    return (
      form.instrumentName.trim().length > 0 &&
      form.ticker.trim().length > 0 &&
      form.price.trim().length > 0 &&
      form.quantity.trim().length > 0 &&
      form.validFrom.trim().length > 0 &&
      form.validTo.trim().length > 0
    );
  }, [form]);

  async function handlePublish() {
    setFeedback(null);
    try {
      await publish.mutateAsync({
        instrumentName: form.instrumentName.trim() || null,
        ticker: form.ticker.trim() || null,
        sector: form.sector.trim() || null,
        price: Number(form.price),
        currency: form.currency.trim() || null,
        quantity: Number(form.quantity),
        minLotSize: form.minLotSize.trim() ? Number(form.minLotSize) : null,
        notes: form.notes.trim() || null,
        validFrom: form.validFrom || null,
        validTo: form.validTo || null,
      });
      setSubmittedInstrumentName(form.instrumentName.trim() || "your listing");
      setShowSuccessModal(true);
    } catch (error) {
      setFeedback(getApiErrorMessage(error));
    }
  }

  const isSubmitting = publish.isPending;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Publish New Listing
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create a new instrument offering for the Ethiopian market.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
          <CircleCheckBig className="size-3.5" />
          {isComplete ? "Form Complete" : "Complete Required Fields"}
        </div>
      </div>

      <section className="border-border space-y-5 rounded-xl border p-5">
        <div>
          <p className="text-xs font-semibold tracking-wide uppercase">
            Instrument Details
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="instrumentName">Instrument Name</Label>
            <Input
              id="instrumentName"
              className="h-11"
              value={form.instrumentName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, instrumentName: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sector">Sector</Label>
            <select
              id="sector"
              value={form.sector}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, sector: e.target.value }))
              }
              className="border-border bg-background h-11 w-full rounded-md border px-3 text-sm"
            >
              <option>Banking</option>
              <option>Insurance</option>
              <option>Telecom</option>
              <option>Industrial</option>
              <option>Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticker">Ticker Symbol</Label>
            <Input
              id="ticker"
              className="h-11"
              value={form.ticker}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, ticker: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              value={form.currency}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, currency: e.target.value }))
              }
              className="border-border bg-background h-11 w-full rounded-md border px-3 text-sm"
            >
              <option>ETB</option>
              <option>USD</option>
            </select>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-wide uppercase">
            Offering Parameters
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">Indicative Price</Label>
            <Input
              id="price"
              className="h-11"
              value={form.price}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, price: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Total Quantity Available</Label>
            <Input
              id="quantity"
              className="h-11"
              value={form.quantity}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, quantity: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minLotSize">Minimum Lot Size</Label>
            <Input
              id="minLotSize"
              className="h-11"
              value={form.minLotSize}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, minLotSize: e.target.value }))
              }
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-wide uppercase">
            Validity Period
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="validFrom">Valid From</Label>
            <Input
              id="validFrom"
              type="date"
              className="h-11"
              value={form.validFrom}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, validFrom: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="validTo">Valid To</Label>
            <Input
              id="validTo"
              type="date"
              className="h-11"
              value={form.validTo}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, validTo: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">
            Broker Notes / Coordination Instructions
          </Label>
          <Textarea
            id="notes"
            className="min-h-[120px]"
            value={form.notes}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, notes: e.target.value }))
            }
          />
          <p className="text-muted-foreground text-xs">
            These notes will be visible to matched institutional clients.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <Button variant="outline" disabled={isSubmitting}>
            Save Draft
          </Button>
          <Button
            onClick={() => void handlePublish()}
            disabled={!isComplete || isSubmitting}
          >
            Publish Listing
          </Button>
        </div>
      </section>

      {feedback ? (
        <p className="text-destructive text-sm" role="alert">
          {feedback}
        </p>
      ) : null}

      <Modal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        closeOnBackdrop={false}
        className="max-w-[420px] p-6"
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200">
            <Clock3 className="size-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Listing Submitted for Review
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your listing for {submittedInstrumentName} has been submitted. An
              admin will review it within 1-2 business days. You&apos;ll be
              notified once it&apos;s approved or if more information is needed.
            </p>
          </div>
          <Button
            className="w-full"
            onClick={() => router.push("/dashboard/broker/listings")}
          >
            Back to My Listings
          </Button>
        </div>
      </Modal>
    </div>
  );
}
