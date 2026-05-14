import type { NotificationItem } from "@/entities/notification/model/types";
import type { UserRole } from "@/shared/api/types";

function norm(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Best-effort deep link from notification payload. Backend should populate
 * `entityType` / `entityId`; we match common .NET-style type names and keywords.
 */
export function getNotificationTargetHref(
  n: NotificationItem,
  role: UserRole | undefined,
): string | null {
  const id = n.entityId?.trim();
  if (!id) return null;

  const nt = norm(n.entityType);
  const ev = norm(n.eventType);
  const blob = `${nt}${ev}`;

  if (role === "Client") {
    if (nt.includes("sellrequest") || blob.includes("sellrequest"))
      return `/requests/sell/${id}`;
    if (nt.includes("buyrequest") || blob.includes("buyrequest"))
      return `/requests/buy/${id}`;
    if (
      blob.includes("conversation") ||
      blob.includes("chatmessage") ||
      blob.includes("directmessage")
    ) {
      return `/messages/${id}`;
    }
    if (nt.includes("listing") || blob.includes("listing"))
      return `/market/${id}`;
    if (
      blob.includes("proposal") ||
      blob.includes("traderequest") ||
      blob.includes("negotiation")
    ) {
      if (blob.includes("sell")) return `/requests/sell/${id}`;
      if (blob.includes("buy")) return `/requests/buy/${id}`;
    }
    return null;
  }

  if (role === "Broker" || role === "Dealer") {
    if (
      nt.includes("sellrequest") ||
      nt.includes("buyrequest") ||
      nt.includes("traderequest") ||
      blob.includes("proposal") ||
      blob.includes("incoming") ||
      blob.includes("brokerreview")
    ) {
      return `/dashboard/broker/requests/${id}`;
    }
    if (
      blob.includes("conversation") ||
      blob.includes("chatmessage") ||
      blob.includes("directmessage")
    ) {
      return `/dashboard/broker/messages/${id}`;
    }
    if (nt.includes("listing") || blob.includes("listing"))
      return `/dashboard/broker/listings/${id}/edit`;
    return null;
  }

  return null;
}
