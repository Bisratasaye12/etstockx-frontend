"use client";

import { MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";

export function EmptyConversationsState() {
  const t = useTranslations("broker.messages");

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
    </div>
  );
}
