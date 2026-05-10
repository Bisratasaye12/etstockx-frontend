"use client";

import { useMemo, useState } from "react";
import { Check, Circle, X } from "lucide-react";
import { Link } from "@/shared/i18n/routing";
import { useBrokerRequestDetail } from "@/features/broker/api/use-broker-request-detail";
import {
  useUpdateBrokerOrderStatus,
  type BrokerOrderTargetStatus,
} from "@/features/broker/api/use-update-broker-order-status";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Modal } from "@/shared/ui/modal";
import { Textarea } from "@/shared/ui/textarea";

function toRequestType(kind: string): 0 | 1 {
  return kind.toLowerCase().includes("sell") ? 1 : 0;
}

const STATUS_OPTIONS: {
  value: BrokerOrderTargetStatus;
  title: string;
  description: string;
}[] = [
  {
    value: "ForwardedToESX",
    title: "Forwarded to ESX",
    description: "Order has been transmitted to the exchange system.",
  },
  {
    value: "PartiallyFilled",
    title: "Partially Filled",
    description: "Order executed partially at the exchange.",
  },
  {
    value: "Filled",
    title: "Filled",
    description: "Order completely executed.",
  },
  {
    value: "Rejected",
    title: "Rejected by ESX",
    description: "Exchange declined the order.",
  },
];

function fmtMoney(n: number | null | undefined, currency = "ETB") {
  if (n == null || Number.isNaN(n)) return "—";
  return `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function OrderStatusPage({
  requestId,
  kind,
}: {
  requestId: string;
  kind: string;
}) {
  const detail = useBrokerRequestDetail(requestId, kind);
  const updateStatus = useUpdateBrokerOrderStatus();

  const [targetStatus, setTargetStatus] =
    useState<BrokerOrderTargetStatus>("ForwardedToESX");
  const [filledQuantity, setFilledQuantity] = useState("");
  const [actualPrice, setActualPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  const request = detail.data?.request;
  const history = useMemo(
    () =>
      [...(detail.data?.history ?? [])].sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      ),
    [detail.data?.history],
  );

  const normalizedKind = kind || "Buy";

  if (detail.isLoading) {
    return <p className="text-muted-foreground text-sm">Loading order…</p>;
  }

  if (detail.isError) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {getApiErrorMessage(detail.error)}
      </p>
    );
  }

  if (!request) {
    return <p className="text-muted-foreground text-sm">Request not found.</p>;
  }

  const reqType = toRequestType(normalizedKind);
  const currency = request.currency ?? "ETB";

  function submitPatch(status: BrokerOrderTargetStatus) {
    const qtyRaw = filledQuantity.trim();
    const priceRaw = actualPrice.trim();
    let fq: number | null = null;
    let ap: number | null = null;

    if (status === "PartiallyFilled" || status === "Filled") {
      fq =
        status === "Filled" ? request.quantity : qtyRaw ? Number(qtyRaw) : null;
      ap = priceRaw ? Number(priceRaw) : null;
    }

    updateStatus.mutate({
      requestId,
      requestType: reqType,
      targetStatus: status,
      filledQuantity: fq,
      actualPrice: ap,
      notes: notes.trim() || null,
    });
  }

  function onSubmit() {
    if (targetStatus === "Rejected") {
      setRejectModalOpen(true);
      return;
    }
    submitPatch(targetStatus);
  }

  const statusBadge =
    (request.status ?? "").toLowerCase().includes("terms") ||
    (request.status ?? "").toLowerCase().includes("agree")
      ? "Terms Agreed"
      : (request.status ?? "Open");

  return (
    <div className="space-y-6">
      <nav className="text-muted-foreground flex flex-wrap gap-1 text-xs">
        <Link
          href="/dashboard/broker/requests"
          className="hover:text-foreground"
        >
          Incoming Requests
        </Link>
        <span aria-hidden>/</span>
        <Link
          href={`/dashboard/broker/requests/${requestId}?kind=${encodeURIComponent(normalizedKind)}`}
          className="hover:text-foreground"
        >
          Request Detail
        </Link>
        <span aria-hidden>/</span>
        <span className="text-foreground">Update Order Status</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Update Order Status
            </h1>
            <Badge variant="secondary">{statusBadge}</Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Report the current status of this order at the Ethiopian Securities
            Exchange.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link
              href={`/dashboard/broker/requests/${requestId}?kind=${encodeURIComponent(normalizedKind)}`}
            >
              Cancel
            </Link>
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={updateStatus.isPending}
          >
            {updateStatus.isPending ? "Submitting…" : "Submit Update"}
          </Button>
        </div>
      </header>

      {updateStatus.isError ? (
        <p className="text-destructive text-sm" role="alert">
          {getApiErrorMessage(updateStatus.error)}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Status selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {STATUS_OPTIONS.map((opt) => {
                const selected = targetStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTargetStatus(opt.value)}
                    className={cn(
                      "border-border hover:bg-muted/50 flex gap-3 rounded-xl border p-4 text-left transition-colors",
                      selected && "border-primary ring-primary/20 ring-2",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                        selected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/40",
                      )}
                    >
                      {selected ? (
                        <Check
                          className="text-primary-foreground size-2.5"
                          aria-hidden
                        />
                      ) : null}
                    </span>
                    <span>
                      <span className="font-medium">{opt.title}</span>
                      <span className="text-muted-foreground mt-1 block text-xs">
                        {opt.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {targetStatus === "PartiallyFilled" ? (
              <div className="bg-primary/5 space-y-4 rounded-xl p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="filled-qty">Quantity filled by ESX</Label>
                    <Input
                      id="filled-qty"
                      inputMode="decimal"
                      value={filledQuantity}
                      onChange={(e) => setFilledQuantity(e.target.value)}
                      placeholder={`Target was ${request.quantity} shares`}
                    />
                    <p className="text-muted-foreground text-xs">
                      Target was {request.quantity} shares.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actual-price">Actual execution price</Label>
                    <div className="flex rounded-md ring-1 ring-foreground/10">
                      <span className="text-muted-foreground border-border flex items-center border-r px-3 text-sm">
                        {currency}
                      </span>
                      <Input
                        id="actual-price"
                        className="border-0 shadow-none ring-0"
                        inputMode="decimal"
                        value={actualPrice}
                        onChange={(e) => setActualPrice(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {targetStatus === "Filled" ? (
              <div className="bg-muted/30 space-y-4 rounded-xl p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="filled-full-qty">Total shares filled</Label>
                    <Input
                      id="filled-full-qty"
                      readOnly
                      value={String(request.quantity)}
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filled-full-price">
                      Final execution price
                    </Label>
                    <div className="flex rounded-md ring-1 ring-foreground/10">
                      <span className="text-muted-foreground border-border flex items-center border-r px-3 text-sm">
                        {currency}
                      </span>
                      <Input
                        id="filled-full-price"
                        className="border-0 shadow-none ring-0"
                        inputMode="decimal"
                        value={actualPrice}
                        onChange={(e) => setActualPrice(e.target.value)}
                        placeholder="Per share"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="internal-notes">Internal notes (optional)</Label>
              <Textarea
                id="internal-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any relevant details for internal records…"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
              <Button
                variant="outline"
                type="button"
                disabled={updateStatus.isPending}
              >
                Save draft
              </Button>
              <Button
                type="button"
                onClick={onSubmit}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? "Submitting…" : "Submit Update"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Order lifecycle</CardTitle>
            </CardHeader>
            <CardContent className="py-4">
              <ul className="space-y-4">
                {history.length === 0 ? (
                  <li className="text-muted-foreground text-sm">
                    No history yet.
                  </li>
                ) : (
                  history.slice(0, 5).map((h, i) => (
                    <li key={h.id} className="flex gap-3 text-sm">
                      <span className="flex flex-col items-center">
                        {i === 0 ? (
                          <Check className="text-primary size-4" aria-hidden />
                        ) : (
                          <Circle
                            className="text-muted-foreground size-4"
                            aria-hidden
                          />
                        )}
                        {i < Math.min(history.length, 5) - 1 ? (
                          <span
                            className="bg-border mt-1 h-6 w-px"
                            aria-hidden
                          />
                        ) : null}
                      </span>
                      <div>
                        <p className="font-medium">
                          {h.toStatus ?? h.fromStatus ?? "Update"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(h.occurredAt).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="text-base">Agreed order summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <dl className="space-y-2">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Client</dt>
                  <dd className="font-medium">
                    {request.clientId.slice(0, 8)}…
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Instrument</dt>
                  <dd className="font-medium">
                    {request.instrumentName ?? request.ticker ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="font-medium">{normalizedKind}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Quantity</dt>
                  <dd className="font-medium">{request.quantity}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Price</dt>
                  <dd className="font-medium">
                    {fmtMoney(request.desiredPrice, currency)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <div className="flex flex-col items-center text-center">
          <span className="bg-destructive/15 mb-4 flex size-14 items-center justify-center rounded-full">
            <span className="bg-destructive text-destructive-foreground flex size-9 items-center justify-center rounded-full">
              <X className="size-5" aria-hidden />
            </span>
          </span>
          <h2 className="text-lg font-semibold">Report ESX rejection?</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            This will mark the order as rejected. The client will be notified
            and the request will be closed.
          </p>
        </div>
        <div className="border-border mt-6 flex gap-3 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setRejectModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            disabled={updateStatus.isPending}
            onClick={() => {
              submitPatch("Rejected");
              setRejectModalOpen(false);
            }}
          >
            Confirm — report rejection
          </Button>
        </div>
      </Modal>
    </div>
  );
}
