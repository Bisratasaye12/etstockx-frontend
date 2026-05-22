import type { NotificationPreference } from "@/entities/notification/model/types";

/** Matches `Notifications:Defaults` in backend appsettings. */
export const NOTIFICATION_PREFERENCE_DEFAULTS = {
  inAppEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  pushEnabled: true,
} as const;

/** Preferred display order for preference rows (API event type strings). */
export const NOTIFICATION_EVENT_DISPLAY_ORDER = [
  "MessageReceived",
  "ProposalSent",
  "BuyRequestReceived",
  "SellRequestReceived",
  "OrderStatusChanged",
  "TermsAgreed",
  "Welcome",
  "BrokerVerified",
  "ListingModerated",
  "Security",
] as const;

export function sortNotificationPreferences(
  items: NotificationPreference[],
): NotificationPreference[] {
  const order = new Map(
    NOTIFICATION_EVENT_DISPLAY_ORDER.map((eventType, index) => [
      eventType.toLowerCase(),
      index,
    ]),
  );

  return [...items].sort((a, b) => {
    const aKey = (a.eventType ?? "").toLowerCase();
    const bKey = (b.eventType ?? "").toLowerCase();
    const aOrder = order.get(aKey) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = order.get(bKey) ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return aKey.localeCompare(bKey);
  });
}

export function buildDefaultPreferenceDraft(
  items: NotificationPreference[],
): NotificationPreference[] {
  return items.map((item) => {
    if (item.isMandatory) {
      return {
        ...item,
        inAppEnabled: true,
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: true,
      };
    }
    return {
      ...item,
      ...NOTIFICATION_PREFERENCE_DEFAULTS,
    };
  });
}
