"use client";

import { createContext, useContext, useMemo } from "react";
import { useTranslations } from "next-intl";

export type MessagingPortalId = "broker" | "investor";

type MessagingPortalValue = {
  portal: MessagingPortalId;
  /** Base path for list + thread routes (no trailing slash). */
  messagesRootPath: string;
};

const MessagingPortalContext = createContext<MessagingPortalValue | null>(null);

export function MessagingPortalProvider({
  portal,
  children,
}: {
  portal: MessagingPortalId;
  children: React.ReactNode;
}) {
  const value = useMemo<MessagingPortalValue>(
    () => ({
      portal,
      messagesRootPath:
        portal === "broker" ? "/dashboard/broker/messages" : "/messages",
    }),
    [portal],
  );

  return (
    <MessagingPortalContext.Provider value={value}>
      {children}
    </MessagingPortalContext.Provider>
  );
}

/** Defaults preserve existing broker-only call sites without a provider. */
export function useMessagingPortal(): MessagingPortalValue {
  const ctx = useContext(MessagingPortalContext);
  return (
    ctx ?? {
      portal: "broker",
      messagesRootPath: "/dashboard/broker/messages",
    }
  );
}

export function usePortalListMessagesTranslations() {
  const { portal } = useMessagingPortal();
  return useTranslations(
    portal === "broker" ? "broker.messages" : "investor.messages",
  );
}

export function usePortalThreadMessagesTranslations() {
  const { portal } = useMessagingPortal();
  return useTranslations(
    portal === "broker" ? "broker.messages.thread" : "investor.messages.thread",
  );
}

export function usePortalComposeMessagesTranslations() {
  const { portal } = useMessagingPortal();
  return useTranslations(
    portal === "broker"
      ? "broker.messages.compose"
      : "investor.messages.compose",
  );
}
