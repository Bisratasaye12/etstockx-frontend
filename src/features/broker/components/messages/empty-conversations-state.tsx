"use client";

import type { ReactNode } from "react";
import { MessageSquare } from "lucide-react";
import { usePortalListMessagesTranslations } from "@/features/messaging/context/messaging-portal-context";

export function EmptyConversationsState({ footer }: { footer?: ReactNode }) {
  const t = usePortalListMessagesTranslations();

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <span
        aria-hidden
        className="bg-primary/10 text-primary/70 flex size-14 items-center justify-center rounded-full"
      >
        <MessageSquare className="size-6" />
      </span>
      <p className="text-foreground text-base font-semibold">
        {t("emptyTitle")}
      </p>
      <p className="text-muted-foreground max-w-sm text-sm">
        {t("emptySubtitle")}
      </p>
      {footer}
    </div>
  );
}
