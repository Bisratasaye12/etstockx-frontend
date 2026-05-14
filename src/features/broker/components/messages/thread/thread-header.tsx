"use client";

import { ArrowLeft, MoreVertical, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { getConversationInitials } from "@/features/messaging/lib/conversation-initials";

type Props = {
  counterpartyName: string | null;
  /** Optional subtitle. Today this is `"Active now"`; future iterations can pass reference numbers / case ids. */
  subtitle?: string | null;
  online?: boolean;
  searchActive: boolean;
  onToggleSearch: () => void;
};

export function ThreadHeader({
  counterpartyName,
  subtitle,
  online = false,
  searchActive,
  onToggleSearch,
}: Props) {
  const t = useTranslations("broker.messages.thread");

  const displayName = counterpartyName?.trim() || t("unknownCounterparty");
  const initials = getConversationInitials(displayName);

  return (
    <div className="border-border flex items-center gap-3 border-b px-4 py-3 md:px-5">
      <Link
        href="/dashboard/broker/messages"
        aria-label={t("backToList")}
        className="text-muted-foreground hover:bg-muted/60 hover:text-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors"
      >
        <ArrowLeft className="size-5" aria-hidden />
      </Link>

      <span
        aria-hidden
        className="bg-primary/15 text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
      >
        {initials}
      </span>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-foreground truncate text-base font-semibold">
          {displayName}
        </span>
        {subtitle ? (
          <span className="text-muted-foreground inline-flex items-center gap-1.5 truncate text-xs">
            {online ? (
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-emerald-500"
              />
            ) : null}
            {subtitle}
          </span>
        ) : null}
      </div>

      <Button
        type="button"
        variant={searchActive ? "default" : "ghost"}
        size="icon"
        aria-pressed={searchActive}
        aria-label={t("toggleSearch")}
        onClick={onToggleSearch}
        className={cn(
          "rounded-full",
          searchActive ? "" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Search className="size-5" aria-hidden />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("moreActions")}
        title={t("moreActionsComingSoon")}
        disabled
        className="text-muted-foreground rounded-full"
      >
        <MoreVertical className="size-5" aria-hidden />
      </Button>
    </div>
  );
}
