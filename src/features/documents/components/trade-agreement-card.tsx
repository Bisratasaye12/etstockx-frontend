"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Modal } from "@/shared/ui/modal";
import { useToast } from "@/shared/ui/toast";
import { cn } from "@/shared/lib/utils";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import type {
  TradeAgreementDto,
  TradeAgreementSignatureDto,
} from "@/features/documents/model/types";
import { useTradeAgreementByRequest } from "@/features/documents/api/use-trade-agreement-by-request";
import { useCreateTradeAgreement } from "@/features/documents/api/use-create-trade-agreement";
import { useSignTradeAgreement } from "@/features/documents/api/use-sign-trade-agreement";
import { useCancelTradeAgreement } from "@/features/documents/api/use-cancel-trade-agreement";
import { useDownloadAgreementPdf } from "@/features/documents/api/use-download-agreement-pdf";
import { TradeAgreementStatusBadge } from "@/features/documents/components/trade-agreement-status-badge";

type Kind = "buy" | "sell";

function fmtMoney(amount: number, currency: string): string {
  return `${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

interface TradeAgreementCardProps {
  requestId: string;
  kind: Kind;
  /** Current request status from Trade module — used to gate "Generate" UX. */
  requestStatus: string | null | undefined;
  /** Decides which actions are visible. */
  viewerRole: "Client" | "Broker";
}

function isTermsAgreedOrLater(status: string | null | undefined): boolean {
  if (!status) return false;
  const n = status.toLowerCase().replace(/\s+/g, "");
  return (
    n.includes("termsagreed") ||
    n.includes("forwarded") ||
    n.includes("partiallyfilled") ||
    n === "filled" ||
    n.endsWith("filled")
  );
}

export function TradeAgreementCard({
  requestId,
  kind,
  requestStatus,
  viewerRole,
}: TradeAgreementCardProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const requestType = kind === "buy" ? "BuyRequest" : "SellRequest";

  const agreementQuery = useTradeAgreementByRequest(requestId, requestType, {
    enabled: isTermsAgreedOrLater(requestStatus),
  });
  const createMutation = useCreateTradeAgreement();
  const signMutation = useSignTradeAgreement();
  const cancelMutation = useCancelTradeAgreement();
  const downloadMutation = useDownloadAgreementPdf();

  const agreement = agreementQuery.data ?? null;
  const currentUserId = session?.user?.id ?? null;

  if (!isTermsAgreedOrLater(requestStatus)) {
    return null;
  }

  if (agreementQuery.isLoading) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Trade agreement</CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading agreement…
          </p>
        </CardContent>
      </Card>
    );
  }

  // No agreement yet — broker can generate; client waits.
  if (!agreement) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-primary" aria-hidden />
            Trade agreement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 py-5">
          <p className="text-sm leading-relaxed">
            Terms have been agreed. The trade agreement summarises the deal and
            once signed by both parties, becomes the off-platform record of the
            transaction.
          </p>

          {viewerRole === "Broker" ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={createMutation.isPending}
                onClick={() => {
                  createMutation.mutate(
                    { requestId, requestType },
                    {
                      onSuccess: () => {
                        showToast("Trade agreement generated.", "success");
                      },
                      onError: (err) => {
                        showToast(getApiErrorMessage(err), "error");
                      },
                    },
                  );
                }}
              >
                {createMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  "Generate agreement"
                )}
              </Button>
              <p className="text-muted-foreground text-xs">
                The client will be notified to e-sign once the agreement is
                ready.
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Your broker hasn&apos;t generated the agreement yet. You&apos;ll
              be notified the moment it&apos;s ready to sign.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <AgreementCardWithDocument
      agreement={agreement}
      viewerRole={viewerRole}
      currentUserId={currentUserId}
      onSign={(typedFullName) => {
        signMutation.mutate(
          {
            agreementId: agreement.id,
            typedFullName,
            acceptedTerms: true,
          },
          {
            onSuccess: (data) => {
              showToast(
                data.status === "FullySigned"
                  ? "Agreement fully signed."
                  : "Signature recorded.",
                "success",
              );
            },
            onError: (err) => showToast(getApiErrorMessage(err), "error"),
          },
        );
      }}
      onCancel={(reason) => {
        cancelMutation.mutate(
          { agreement, reason },
          {
            onSuccess: () => showToast("Agreement cancelled.", "success"),
            onError: (err) => showToast(getApiErrorMessage(err), "error"),
          },
        );
      }}
      onDownload={() => {
        downloadMutation.mutate(
          {
            agreementId: agreement.id,
            fileNameHint: `${agreement.documentNumber}.pdf`,
          },
          {
            onError: (err) => showToast(getApiErrorMessage(err), "error"),
          },
        );
      }}
      signing={signMutation.isPending}
      cancelling={cancelMutation.isPending}
      downloading={downloadMutation.isPending}
    />
  );
}

interface AgreementInnerProps {
  agreement: TradeAgreementDto;
  viewerRole: "Client" | "Broker";
  currentUserId: string | null;
  onSign: (typedFullName: string) => void;
  onCancel: (reason: string) => void;
  onDownload: () => void;
  signing: boolean;
  cancelling: boolean;
  downloading: boolean;
}

function AgreementCardWithDocument({
  agreement,
  viewerRole,
  currentUserId,
  onSign,
  onCancel,
  onDownload,
  signing,
  cancelling,
  downloading,
}: AgreementInnerProps) {
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const isCancelled = agreement.status === "Cancelled";
  const isFullySigned = agreement.status === "FullySigned";

  const mySignature: TradeAgreementSignatureDto | undefined = useMemo(() => {
    if (!currentUserId) return undefined;
    return agreement.signatures.find((s) => s.signerUserId === currentUserId);
  }, [agreement.signatures, currentUserId]);

  const expectedRoleNow: "Client" | "Broker" | null = useMemo(() => {
    if (agreement.status === "AwaitingClientSignature") return "Client";
    if (agreement.status === "AwaitingBrokerSignature") return "Broker";
    return null;
  }, [agreement.status]);

  const canSign =
    !isCancelled &&
    !isFullySigned &&
    !mySignature &&
    expectedRoleNow !== null &&
    expectedRoleNow === viewerRole;

  const canCancel = !isCancelled && !isFullySigned && viewerRole === "Broker";

  const clientSig = agreement.signatures.find((s) => s.signerRole === "Client");
  const brokerSig = agreement.signatures.find((s) => s.signerRole === "Broker");

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-primary" aria-hidden />
              Trade agreement
            </CardTitle>
            <p className="text-muted-foreground mt-1 font-mono text-xs">
              {agreement.documentNumber}
            </p>
          </div>
          <TradeAgreementStatusBadge status={agreement.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-5 py-5">
        {isCancelled ? (
          <div
            className="border-destructive/30 bg-destructive/10 text-destructive flex gap-3 rounded-lg border px-3 py-2.5 text-sm"
            role="alert"
          >
            <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">This agreement was cancelled.</p>
              {agreement.cancellationReason ? (
                <p className="mt-1 text-xs opacity-80">
                  Reason: {agreement.cancellationReason}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Summary */}
        <dl className="grid gap-3 sm:grid-cols-2">
          <SummaryRow
            label="Instrument"
            value={
              agreement.ticker
                ? `${agreement.instrumentName} (${agreement.ticker})`
                : agreement.instrumentName
            }
          />
          <SummaryRow
            label="Quantity"
            value={agreement.quantity.toLocaleString()}
          />
          <SummaryRow
            label="Unit price"
            value={fmtMoney(agreement.unitPrice, agreement.currency)}
          />
          <SummaryRow
            label="Subtotal"
            value={fmtMoney(agreement.subtotal, agreement.currency)}
          />
          <SummaryRow
            label={`Platform fee (${agreement.feePercent.toLocaleString("en-US", { maximumFractionDigits: 2 })}%)`}
            value={fmtMoney(agreement.feeAmount, agreement.currency)}
          />
          <SummaryRow
            label="Total"
            value={fmtMoney(agreement.totalAmount, agreement.currency)}
            strong
          />
          <SummaryRow label="Client" value={agreement.clientFullName} />
          <SummaryRow
            label="Broker"
            value={
              agreement.brokerInstitution
                ? `${agreement.brokerFullName} · ${agreement.brokerInstitution}`
                : agreement.brokerFullName
            }
          />
          <SummaryRow
            label="Agreed on"
            value={fmtDateTime(agreement.agreedAt)}
          />
        </dl>

        {/* Signatures */}
        <div className="grid gap-3 sm:grid-cols-2">
          <SignatureBlock label="Client" signature={clientSig} />
          <SignatureBlock label="Broker" signature={brokerSig} />
        </div>

        {/* Hash + verify */}
        {isFullySigned && agreement.documentHash ? (
          <div className="border-border/80 bg-muted/30 space-y-2 rounded-lg border px-3 py-2.5">
            <p className="flex items-center gap-2 text-xs font-semibold">
              <ShieldCheck
                className="size-4 text-emerald-600 dark:text-emerald-300"
                aria-hidden
              />
              Document integrity
            </p>
            <p className="text-muted-foreground text-xs">
              SHA-256:{" "}
              <code className="break-all font-mono">
                {agreement.documentHash}
              </code>
            </p>
            {agreement.verificationUrl ? (
              <p className="text-xs">
                Verify:{" "}
                <a
                  href={agreement.verificationUrl}
                  className="text-primary underline-offset-2 hover:underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {agreement.verificationUrl}
                </a>
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onDownload}
            disabled={downloading}
            className="gap-2"
          >
            {downloading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="size-4" aria-hidden />
            )}
            {isFullySigned ? "Download signed PDF" : "Preview draft PDF"}
          </Button>

          {canSign ? (
            <Button
              type="button"
              onClick={() => setSignModalOpen(true)}
              disabled={signing}
            >
              {signing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                "Sign agreement"
              )}
            </Button>
          ) : null}

          {mySignature && !isFullySigned ? (
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <CheckCircle2
                className="text-emerald-600 dark:text-emerald-300 size-4"
                aria-hidden
              />
              You signed. Awaiting the counterparty.
            </p>
          ) : null}

          {canCancel ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelModalOpen(true)}
              disabled={cancelling}
              className="ml-auto text-destructive border-destructive/40 hover:bg-destructive/10"
            >
              Cancel agreement
            </Button>
          ) : null}
        </div>

        {isFullySigned ? (
          <div className="border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 flex gap-3 rounded-lg border px-3 py-2.5 text-sm">
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-300"
              aria-hidden
            />
            <p>
              Both parties have e-signed. Either side can download the canonical
              PDF and use it for off-platform settlement.
            </p>
          </div>
        ) : null}
      </CardContent>

      {/* Sign modal */}
      <Modal open={signModalOpen} onOpenChange={setSignModalOpen}>
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Sign trade agreement</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              By signing, you confirm the terms of agreement{" "}
              <span className="font-mono">{agreement.documentNumber}</span> and
              acknowledge this is your legally binding electronic signature.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="typed-name">Type your full legal name</Label>
            <Input
              id="typed-name"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="e.g. Abebe Kebede Tadesse"
            />
          </div>

          <label className="flex items-start gap-2 text-sm leading-relaxed">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 size-4 shrink-0"
            />
            <span>
              I have read and accept the terms of this trade agreement and the
              EtStockX platform conditions.
            </span>
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline" }))}
              onClick={() => setSignModalOpen(false)}
              disabled={signing}
            >
              Cancel
            </button>
            <Button
              type="button"
              disabled={signing || typedName.trim().length < 3 || !accepted}
              onClick={() => {
                onSign(typedName.trim());
                setSignModalOpen(false);
                setTypedName("");
                setAccepted(false);
              }}
            >
              {signing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                "Sign and lock"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel modal */}
      <Modal open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Cancel trade agreement</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              This will void the agreement. You can generate a new one if
              needed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Why is this agreement being cancelled?"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline" }))}
              onClick={() => setCancelModalOpen(false)}
              disabled={cancelling}
            >
              Keep agreement
            </button>
            <Button
              type="button"
              variant="destructive"
              disabled={cancelling || cancelReason.trim().length < 3}
              onClick={() => {
                onCancel(cancelReason.trim());
                setCancelModalOpen(false);
                setCancelReason("");
              }}
            >
              {cancelling ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                "Cancel agreement"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </dt>
      <dd className={cn("mt-1 text-sm", strong && "font-bold")}>{value}</dd>
    </div>
  );
}

function SignatureBlock({
  label,
  signature,
}: {
  label: string;
  signature: TradeAgreementSignatureDto | undefined;
}) {
  return (
    <div className="border-border/80 rounded-lg border p-3">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label} signature
      </p>
      {signature ? (
        <div className="mt-2 space-y-1.5">
          <p className="text-primary text-lg font-semibold italic leading-tight">
            {signature.typedFullName}
          </p>
          <p className="text-muted-foreground text-xs">
            Signed {fmtDateTime(signature.signedAt)}
          </p>
          <p className="text-muted-foreground text-[10px] font-mono break-all">
            Token: {signature.signatureToken.slice(0, 32)}…
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground mt-2 text-sm italic">
          Pending signature
        </p>
      )}
    </div>
  );
}
