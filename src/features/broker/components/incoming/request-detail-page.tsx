"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Circle } from "lucide-react";
import { Link } from "@/shared/i18n/routing";
import { useBrokerRequestDetail } from "@/features/broker/api/use-broker-request-detail";
import { useSendBrokerProposal } from "@/features/broker/api/use-send-broker-proposal";
import type {
  OrderHistoryEntryDto,
  TradeProposalDto,
} from "@/features/broker/model/types";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

const COMMISSION_RATE = 0.015;

function toRequestType(kind: string): 0 | 1 {
  return kind.toLowerCase().includes("sell") ? 1 : 0;
}

function normalizeStatus(status: string | null | undefined) {
  return (status ?? "").toLowerCase().replace(/\s+/g, "");
}

function isFilledReadOnly(status: string | null | undefined) {
  const n = normalizeStatus(status);
  if (n.includes("partiallyfilled") || n.includes("partial")) return false;
  return n.includes("filled") || n === "filled";
}

function isNegotiation(
  status: string | null | undefined,
  proposals: TradeProposalDto[] | null,
) {
  const n = normalizeStatus(status);
  if (n.includes("negotiat")) return true;
  const rejected = proposals?.some((p) =>
    normalizeStatus(p.status).includes("reject"),
  );
  return Boolean(rejected);
}

function fmtMoney(n: number | null | undefined, currency = "ETB") {
  if (n == null || Number.isNaN(n)) return "—";
  return `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function proposalStatusBadgeVariant(
  status: string | null | undefined,
): "default" | "secondary" | "destructive" | "outline" {
  const s = normalizeStatus(status);
  if (s.includes("reject")) return "destructive";
  if (s.includes("accept") || s.includes("agree")) return "default";
  return "secondary";
}

function ReqBreadcrumbs({ requestId }: { requestId: string }) {
  return (
    <nav className="text-muted-foreground mb-2 flex flex-wrap gap-1 text-xs">
      <Link href="/dashboard/broker/requests" className="hover:text-foreground">
        Incoming Requests
      </Link>
      <span aria-hidden>/</span>
      <span className="text-foreground">
        REQ-{requestId.slice(0, 4).toUpperCase()}
      </span>
    </nav>
  );
}

export function RequestDetailPage({
  requestId,
  kind,
}: {
  requestId: string;
  kind: string;
}) {
  const detail = useBrokerRequestDetail(requestId, kind);
  const proposal = useSendBrokerProposal();

  const [proposedQuantity, setProposedQuantity] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [notes, setNotes] = useState("");

  const normalizedKind = kind || "Buy";
  const request = detail.data?.request;
  const proposals = detail.data?.proposals ?? null;
  const history = useMemo(
    () =>
      [...(detail.data?.history ?? [])].sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      ),
    [detail.data?.history],
  );

  const sortedProposals = useMemo(
    () =>
      [...(proposals ?? [])].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [proposals],
  );

  const lastProposal = sortedProposals[0];
  const topProposalId = sortedProposals[0]?.id ?? "none";
  const formSeedKey = `${request?.id ?? ""}:${request?.status ?? ""}:${topProposalId}`;

  useEffect(() => {
    if (!request || !detail.isSuccess) return;
    if (isFilledReadOnly(request.status)) return;
    const lp = sortedProposals[0];
    if (isNegotiation(request.status, proposals)) {
      if (lp) {
        setProposedQuantity(
          lp.proposedQuantity != null ? String(lp.proposedQuantity) : "",
        );
        setProposedPrice(
          lp.proposedPrice != null ? String(lp.proposedPrice) : "",
        );
      } else {
        setProposedQuantity(String(request.quantity));
        setProposedPrice(
          request.desiredPrice != null ? String(request.desiredPrice) : "",
        );
      }
      return;
    }
    setProposedQuantity(String(request.quantity));
    setProposedPrice(
      request.desiredPrice != null ? String(request.desiredPrice) : "",
    );
    // Intentionally depend on formSeedKey so edits survive refetches with the same top proposal.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- formSeedKey aggregates request + proposal identity
  }, [formSeedKey, detail.isSuccess]);

  const grossValue = useMemo(() => {
    const q = Number(proposedQuantity);
    const p = Number(proposedPrice);
    if (!Number.isFinite(q) || !Number.isFinite(p)) return null;
    return q * p;
  }, [proposedQuantity, proposedPrice]);

  const commission = grossValue != null ? grossValue * COMMISSION_RATE : null;
  const settlement =
    grossValue != null && commission != null ? grossValue + commission : null;

  const filledSummary = useMemo(() => {
    if (!history.length) return null;
    const filledEntry = history.find(
      (h) =>
        normalizeStatus(h.toStatus).includes("filled") &&
        !normalizeStatus(h.toStatus).includes("partial"),
    );
    const withExec = history.find(
      (h) => h.actualPrice != null && h.filledQuantity != null,
    );
    const entry = filledEntry ?? withExec ?? history[0];
    return entry;
  }, [history]);

  const canUpdateOrderStatus = useMemo(() => {
    const n = normalizeStatus(request?.status);
    return (
      (n.includes("terms") && n.includes("agree")) ||
      n.includes("termsagreed") ||
      n.includes("forwardedtoesx") ||
      (n.includes("forwarded") && n.includes("esx"))
    );
  }, [request?.status]);

  if (detail.isLoading) {
    return (
      <p className="text-muted-foreground text-sm">Loading request detail…</p>
    );
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

  const currency = request.currency ?? "ETB";
  const titleInstrument =
    request.ticker ?? request.instrumentName ?? "Security";
  const pageTitle =
    normalizedKind.toLowerCase().includes("sell") || normalizedKind === "Sell"
      ? `Sale Request: ${request.quantity} shares · ${titleInstrument}`
      : `Purchase Request: ${request.quantity} shares of ${titleInstrument}`;

  const statusLabel = request.status ?? "Open";

  if (isFilledReadOnly(request.status)) {
    return (
      <div className="space-y-6">
        <ReqBreadcrumbs requestId={requestId} />
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              REQ-{requestId.slice(0, 4)}
            </h1>
            <Badge
              variant="default"
              className="mt-2 bg-emerald-600 text-white hover:bg-emerald-600"
            >
              Filled
            </Badge>
          </div>
        </header>

        <div
          className="border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100 flex gap-3 rounded-xl border px-4 py-3 text-sm"
          role="status"
        >
          <Check className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">
              This request has been filled. No further actions are needed.
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              The transaction was completed
              {filledSummary
                ? ` on ${fmtDateTime(filledSummary.occurredAt)}.`
                : "."}{" "}
              All relevant documents have been archived.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Client request details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 py-4 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-xs">Client</p>
                  <p className="text-primary font-medium">
                    {request.clientId.slice(0, 8)}…
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Request type</p>
                  <p className="font-medium">{normalizedKind} shares</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Target asset</p>
                  <p className="font-medium">
                    {request.instrumentName ?? request.ticker ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Requested volume
                  </p>
                  <p className="font-medium">{request.quantity} shares</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Budget / price limit
                  </p>
                  <p className="font-medium">
                    {fmtMoney(request.desiredPrice, currency)} per share
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Submitted</p>
                  <p className="font-medium">
                    {fmtDateTime(request.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle>Transaction summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 py-4 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">
                    Final executed price
                  </span>
                  <span className="font-medium">
                    {fmtMoney(
                      filledSummary?.actualPrice ?? request.desiredPrice,
                      currency,
                    )}{" "}
                    / share
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Total shares</span>
                  <span className="font-medium">
                    {filledSummary?.filledQuantity ?? request.quantity} shares
                  </span>
                </div>
                <div className="flex justify-between gap-2 border-t pt-3">
                  <span className="text-muted-foreground">
                    Total transaction value
                  </span>
                  <span className="text-primary text-lg font-semibold">
                    {fmtMoney(
                      filledSummary?.actualPrice != null &&
                        filledSummary.filledQuantity != null
                        ? filledSummary.actualPrice *
                            filledSummary.filledQuantity
                        : request.desiredPrice != null
                          ? request.desiredPrice * request.quantity
                          : null,
                      currency,
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Request timeline</CardTitle>
            </CardHeader>
            <CardContent className="py-4">
              <HistoryTimeline entries={history} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isNegotiation(request.status, proposals)) {
    return (
      <div className="space-y-6">
        <ReqBreadcrumbs requestId={requestId} />
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {pageTitle}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
              >
                {statusLabel}
              </Badge>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled
            title="Not available via API"
          >
            Reject
          </Button>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-base">Client &amp; asset</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="bg-primary/15 text-primary flex size-11 items-center justify-center rounded-full text-sm font-semibold">
                    {request.clientId.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="font-medium">
                      Client {request.clientId.slice(0, 8)}…
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Retail investor
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-primary font-semibold">
                    {request.instrumentName ?? "—"}{" "}
                    {request.ticker ? `(${request.ticker})` : null}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Current indicative:{" "}
                    {fmtMoney(request.desiredPrice, currency)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-base">Request timeline</CardTitle>
              </CardHeader>
              <CardContent className="py-4">
                <HistoryTimeline entries={history} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-base">Previous proposals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 py-4">
                {sortedProposals.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No proposals yet.
                  </p>
                ) : (
                  sortedProposals.map((p) => {
                    const lineGross =
                      p.proposedQuantity != null && p.proposedPrice != null
                        ? p.proposedQuantity * p.proposedPrice
                        : null;
                    return (
                      <div
                        key={p.id}
                        className="border-border space-y-2 rounded-lg border p-3 text-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={proposalStatusBadgeVariant(p.status)}>
                            {(p.status ?? "Proposal").toUpperCase()}
                          </Badge>
                        </div>
                        <p className="font-medium">
                          {p.proposedQuantity ?? "—"} shares @{" "}
                          {fmtMoney(p.proposedPrice, currency)}
                        </p>
                        {lineGross != null ? (
                          <p className="text-muted-foreground text-xs">
                            Total value: {fmtMoney(lineGross, currency)}
                          </p>
                        ) : null}
                        {p.notes ? (
                          <p className="bg-muted/50 mt-2 rounded-md p-2 text-xs">
                            {p.notes}
                          </p>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit xl:sticky xl:top-24">
            <CardHeader className="border-b">
              <CardTitle>Counter-proposal builder</CardTitle>
              <p className="text-muted-foreground text-xs">
                Specify the terms you can offer this client.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="neg-qty">Quantity (shares)</Label>
                <Input
                  id="neg-qty"
                  value={proposedQuantity}
                  onChange={(e) => setProposedQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neg-price">Unit price ({currency})</Label>
                <Input
                  id="neg-price"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                />
                {lastProposal ? (
                  <p className="text-muted-foreground text-xs">
                    Prefilled from last proposal.
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Client requested {request.quantity} shares.
                  </p>
                )}
              </div>

              <div className="bg-muted/40 space-y-2 rounded-lg p-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Gross value</span>
                  <span>{fmtMoney(grossValue, currency)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">
                    Est. commission (1.5%)
                  </span>
                  <span>{fmtMoney(commission, currency)}</span>
                </div>
                <div className="flex justify-between gap-2 border-t pt-2 font-semibold">
                  <span>Total settlement</span>
                  <span className="text-primary">
                    {fmtMoney(settlement, currency)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="neg-notes">Notes to client (optional)</Label>
                <Textarea
                  id="neg-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add context to your counter-proposal…"
                />
              </div>

              {proposal.isError ? (
                <p className="text-destructive text-sm" role="alert">
                  {getApiErrorMessage(proposal.error)}
                </p>
              ) : null}

              <Button
                type="button"
                className="w-full"
                disabled={proposal.isPending}
                onClick={() =>
                  proposal.mutate({
                    requestId,
                    requestType: toRequestType(normalizedKind),
                    proposedQuantity: proposedQuantity.trim()
                      ? Number(proposedQuantity)
                      : null,
                    proposedPrice: proposedPrice.trim()
                      ? Number(proposedPrice)
                      : null,
                    notes: notes.trim() || null,
                  })
                }
              >
                {proposal.isPending ? "Sending…" : "Send counter-proposal"}
              </Button>

              {canUpdateOrderStatus ? (
                <Button variant="outline" className="w-full" asChild>
                  <Link
                    href={`/dashboard/broker/requests/${requestId}/order-status?kind=${encodeURIComponent(normalizedKind)}`}
                  >
                    Update order status
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /* Pending review — initial proposal */
  return (
    <div className="space-y-6">
      <ReqBreadcrumbs requestId={requestId} />
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Request Detail
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Review the client request and send your proposal.
        </p>
        {canUpdateOrderStatus ? (
          <Button className="mt-3" variant="outline" asChild>
            <Link
              href={`/dashboard/broker/requests/${requestId}/order-status?kind=${encodeURIComponent(normalizedKind)}`}
            >
              Update order status
            </Link>
          </Button>
        ) : null}
      </header>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Client Request</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 py-4 md:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-xs">Client</p>
            <p className="font-medium">{request.clientId}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Type</p>
            <Badge variant="outline">{normalizedKind}</Badge>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Status</p>
            <Badge variant="secondary">{statusLabel}</Badge>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Instrument</p>
            <p className="font-medium">
              {request.instrumentName ?? request.ticker ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Quantity</p>
            <p className="font-medium">{request.quantity}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Desired Price</p>
            <p className="font-medium">
              {request.desiredPrice == null
                ? "—"
                : `${currency} ${request.desiredPrice}`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Send Proposal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="proposed-qty">Proposed Quantity</Label>
              <Input
                id="proposed-qty"
                value={proposedQuantity}
                onChange={(e) => setProposedQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposed-price">Proposed Price per Share</Label>
              <Input
                id="proposed-price"
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="proposal-notes">Notes to Client (Optional)</Label>
            <Textarea
              id="proposal-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {proposal.isError ? (
            <p className="text-destructive text-sm" role="alert">
              {getApiErrorMessage(proposal.error)}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={proposal.isPending}
              onClick={() =>
                proposal.mutate({
                  requestId,
                  requestType: toRequestType(normalizedKind),
                  proposedQuantity: proposedQuantity.trim()
                    ? Number(proposedQuantity)
                    : null,
                  proposedPrice: proposedPrice.trim()
                    ? Number(proposedPrice)
                    : null,
                  notes: notes.trim() || null,
                })
              }
            >
              {proposal.isPending ? "Sending…" : "Send Proposal"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HistoryTimeline({ entries }: { entries: OrderHistoryEntryDto[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No timeline events yet.</p>
    );
  }

  return (
    <ul className="space-y-4">
      {entries.map((h, i) => (
        <li key={h.id} className="flex gap-3 text-sm">
          <span className="flex flex-col items-center">
            {i === 0 ? (
              <Check className="text-primary size-4 shrink-0" aria-hidden />
            ) : (
              <Circle
                className="text-muted-foreground size-4 shrink-0"
                aria-hidden
              />
            )}
            {i < entries.length - 1 ? (
              <span
                className="bg-border mt-1 min-h-[1.25rem] w-px grow"
                aria-hidden
              />
            ) : null}
          </span>
          <div className="pb-1">
            <p className="font-medium">
              {h.toStatus ?? h.fromStatus ?? "Update"}
              {h.notes ? (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  · {h.notes}
                </span>
              ) : null}
            </p>
            <p className="text-muted-foreground text-xs">
              {fmtDateTime(h.occurredAt)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
