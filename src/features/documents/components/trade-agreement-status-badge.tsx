import { cn } from "@/shared/lib/utils";
import type { TradeAgreementStatus } from "@/features/documents/model/types";

export function statusLabel(status: TradeAgreementStatus): string {
  switch (status) {
    case "AwaitingClientSignature":
      return "Awaiting client signature";
    case "AwaitingBrokerSignature":
      return "Awaiting broker signature";
    case "FullySigned":
      return "Fully signed";
    case "Cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function statusClassName(status: TradeAgreementStatus): string {
  switch (status) {
    case "FullySigned":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
    case "Cancelled":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    case "AwaitingClientSignature":
    case "AwaitingBrokerSignature":
    default:
      return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200";
  }
}

export function TradeAgreementStatusBadge({
  status,
  className,
}: {
  status: TradeAgreementStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        statusClassName(status),
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          status === "FullySigned"
            ? "bg-emerald-500"
            : status === "Cancelled"
              ? "bg-destructive"
              : "bg-amber-500",
        )}
        aria-hidden
      />
      {statusLabel(status)}
    </span>
  );
}
