"use client";

import { useMemo, useState } from "react";
import { CircleCheckBig } from "lucide-react";
import { useRouter } from "@/shared/i18n/routing";
import { usePublishBrokerListing } from "@/features/broker/api/use-publish-broker-listing";
import { useMarketSecurities } from "@/features/market/api/use-market-securities";
import type { SecurityDto } from "@/features/market/model/security-types";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Modal } from "@/shared/ui/modal";
import { Textarea } from "@/shared/ui/textarea";

type FormState = {
  securityId: string;
  currency: string;
  price: string;
  quantity: string;
  minLotSize: string;
  validFrom: string;
  validTo: string;
  notes: string;
};

const initialState: FormState = {
  securityId: "",
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
  const [securitySearch, setSecuritySearch] = useState("");
  const securities = useMarketSecurities(securitySearch);
  const [form, setForm] = useState<FormState>(initialState);
  const [pickedSecurity, setPickedSecurity] = useState<SecurityDto | null>(
    null,
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [postedLabel, setPostedLabel] = useState("");

  const isComplete = useMemo(() => {
    return (
      form.securityId.length > 0 &&
      form.price.trim().length > 0 &&
      form.quantity.trim().length > 0 &&
      form.validFrom.trim().length > 0 &&
      form.validTo.trim().length > 0
    );
  }, [form]);

  function selectSecurity(security: SecurityDto) {
    setPickedSecurity(security);
    setForm((prev) => ({
      ...prev,
      securityId: security.id,
      price:
        prev.price.trim().length > 0
          ? prev.price
          : security.referencePrice != null
            ? String(security.referencePrice)
            : prev.price,
    }));
    setSecuritySearch(`${security.ticker} — ${security.name}`);
  }

  async function handlePublish() {
    setFeedback(null);
    try {
      await publish.mutateAsync({
        securityId: form.securityId,
        price: Number(form.price),
        currency: form.currency.trim() || null,
        quantity: Number(form.quantity),
        minLotSize: form.minLotSize.trim() ? Number(form.minLotSize) : null,
        notes: form.notes.trim() || null,
        validFrom: form.validFrom || null,
        validTo: form.validTo || null,
      });
      setPostedLabel(
        pickedSecurity
          ? `${pickedSecurity.ticker} — ${pickedSecurity.name}`
          : "your listing",
      );
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
            Select a security from the platform catalog, then set your offer
            price and quantity.
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
            Security (from catalog)
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Choose the listed company. Instrument name and ticker are set
            automatically.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="securitySearch">Search securities</Label>
          <Input
            id="securitySearch"
            className="h-11"
            placeholder="Search by ticker or name (e.g. ETEL)"
            value={securitySearch}
            onChange={(e) => setSecuritySearch(e.target.value)}
          />
        </div>
        {securities.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading securities…</p>
        ) : null}
        <ul className="border-border max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
          {(securities.data?.items ?? []).map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => selectSecurity(s)}
                className={`hover:bg-muted w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  form.securityId === s.id ? "bg-muted font-medium" : ""
                }`}
              >
                <span className="font-mono">{s.ticker}</span>
                <span className="mx-2 text-muted-foreground">—</span>
                {s.name}
                {s.referencePrice != null ? (
                  <span className="text-muted-foreground ml-2">
                    (ref. {s.referencePrice.toLocaleString()}{" "}
                    {s.referenceCurrency})
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
        {pickedSecurity ? (
          <p className="text-sm">
            Selected:{" "}
            <span className="font-medium">
              {pickedSecurity.ticker} — {pickedSecurity.name}
            </span>
            {pickedSecurity.sector ? (
              <span className="text-muted-foreground">
                {" "}
                · {pickedSecurity.sector}
              </span>
            ) : null}
          </p>
        ) : (
          <p className="text-destructive text-sm">
            Select a security to continue.
          </p>
        )}

        <div>
          <p className="text-xs font-semibold tracking-wide uppercase">
            Offering Parameters
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">Your offer price</Label>
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
          <div className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
            <CircleCheckBig className="size-7" aria-hidden />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Listing Posted Successfully
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your listing for {postedLabel} has been published and is now
              visible to investors on the platform.
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
