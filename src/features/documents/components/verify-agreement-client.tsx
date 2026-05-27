"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/lib/utils";
import { useVerifyTradeAgreement } from "@/features/documents/api/use-verify-trade-agreement";
import { TradeAgreementStatusBadge } from "@/features/documents/components/trade-agreement-status-badge";
import type { TradeAgreementStatus } from "@/features/documents/model/types";

interface VerifyAgreementClientProps {
  initialDocumentNumber: string;
  initialHash: string;
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function VerifyAgreementClient({
  initialDocumentNumber,
  initialHash,
}: VerifyAgreementClientProps) {
  const [doc, setDoc] = useState(initialDocumentNumber);
  const [hash, setHash] = useState(initialHash);
  const [submitted, setSubmitted] = useState(
    initialDocumentNumber.trim().length > 0 && initialHash.trim().length > 0,
  );

  const query = useVerifyTradeAgreement(doc.trim(), hash.trim(), {
    enabled: submitted,
  });

  const verification = query.data;

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Verify a trade agreement
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
          Enter the document number and SHA-256 hash printed on the bottom of
          the signed trade agreement PDF to confirm its authenticity against the
          EtStockX canonical record.
        </p>
      </header>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Document details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 py-5">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
              void query.refetch();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="verify-doc">Document number</Label>
              <Input
                id="verify-doc"
                value={doc}
                onChange={(e) => setDoc(e.target.value)}
                placeholder="e.g. ETSX-AGR-2026-000123"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verify-hash">SHA-256 hash</Label>
              <Input
                id="verify-hash"
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                placeholder="64-character hex string from the PDF"
                className="font-mono"
              />
            </div>
            <div>
              <Button
                type="submit"
                disabled={
                  query.isFetching ||
                  doc.trim().length === 0 ||
                  hash.trim().length === 0
                }
                className="gap-2"
              >
                {query.isFetching ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                Verify
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {submitted && query.isError ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm"
        >
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Could not verify this document.</p>
            <p className="mt-1 text-xs opacity-80">
              The document number may be incorrect, or the document does not
              exist in our records.
            </p>
          </div>
        </div>
      ) : null}

      {submitted && verification ? (
        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">Verification result</CardTitle>
                <p className="text-muted-foreground mt-1 font-mono text-xs">
                  {verification.documentNumber}
                </p>
              </div>
              <TradeAgreementStatusBadge
                status={verification.status as TradeAgreementStatus}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-5 py-5">
            <div
              className={cn(
                "flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm",
                verification.verified
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
                  : "border-destructive/30 bg-destructive/10 text-destructive",
              )}
              role="status"
            >
              {verification.verified ? (
                <ShieldCheck
                  className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-300"
                  aria-hidden
                />
              ) : (
                <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
              )}
              <div className="space-y-1">
                <p className="font-semibold">
                  {verification.verified
                    ? "Authentic — hash matches our canonical record."
                    : "Hash mismatch — this document could not be verified."}
                </p>
                {!verification.verified ? (
                  <p className="text-xs opacity-80">
                    The provided hash does not match the document we have on
                    file. The PDF may have been altered, or the hash may have
                    been copied incorrectly.
                  </p>
                ) : null}
              </div>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Stored SHA-256
                </dt>
                <dd className="mt-1 break-all font-mono text-xs">
                  {verification.storedHash ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Finalized at
                </dt>
                <dd className="mt-1 text-sm">
                  {fmtDateTime(verification.finalizedAt)}
                </dd>
              </div>
            </dl>

            {verification.signatures.length > 0 ? (
              <div>
                <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
                  Signatures on file
                </p>
                <ul className="space-y-2">
                  {verification.signatures.map((sig) => (
                    <li
                      key={sig.id}
                      className="border-border/80 flex items-start gap-3 rounded-lg border p-3"
                    >
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-300"
                        aria-hidden
                      />
                      <div className="space-y-0.5">
                        <p className="text-sm">
                          <span className="font-semibold">
                            {sig.typedFullName}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            ({sig.signerRole})
                          </span>
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Signed {fmtDateTime(sig.signedAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
