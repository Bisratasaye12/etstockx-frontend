"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";
import type { ConversationDto } from "@/entities/messaging/model/types";
import { getConversationInitials } from "@/features/messaging/lib/conversation-initials";
import { formatConversationTime } from "@/features/messaging/lib/format-conversation-time";

type Props = {
  conversation: ConversationDto;
  isActive: boolean;
  locale: string;
};

export function ConversationListItem({
  conversation,
  isActive,
  locale,
}: Props) {
  const t = useTranslations("broker.messages");

  const displayName =
    conversation.counterpartyName?.trim() || t("unknownCounterparty");
  const preview = conversation.lastMessagePreview?.trim() || t("noPreview");

  const time = formatConversationTime(conversation.lastMessageAt, locale, {
    now: t("time.now"),
    minutesAgo: (n) => t("time.minutesAgo", { n }),
    hoursAgo: (n) => t("time.hoursAgo", { n }),
    yesterday: t("time.yesterday"),
  });

  const hasUnread = conversation.unreadCount > 0;
  const initials = getConversationInitials(conversation.counterpartyName);

  return (
    <Link
      href={`/dashboard/broker/messages/${conversation.id}`}
      aria-label={t("openConversation", { name: displayName })}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex items-start gap-3 border-b border-border px-4 py-4 transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none md:px-5",
        isActive && "bg-primary/[0.06]",
      )}
    >
      {isActive ? (
        <span
          aria-hidden
          className="bg-primary absolute top-0 bottom-0 left-0 w-1 rounded-r-sm"
        />
      ) : null}

      <span
        aria-hidden
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold tracking-wide",
          hasUnread
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        {initials}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "text-foreground truncate text-sm font-semibold",
            isActive && "text-primary",
          )}
        >
          {displayName}
        </span>
        <span
          className={cn(
            "text-muted-foreground line-clamp-1 text-sm leading-snug",
            hasUnread && "text-foreground/90 font-medium",
          )}
        >
          {preview}
        </span>
      </span>

      <span className="ml-2 flex shrink-0 flex-col items-end gap-1.5">
        <span
          className={cn(
            "text-muted-foreground text-xs whitespace-nowrap tabular-nums",
            (isActive || hasUnread) && "text-primary font-semibold",
          )}
        >
          {time}
        </span>
        {hasUnread ? (
          <span
            className="bg-primary text-primary-foreground flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none"
            aria-label={t("unreadMessages", {
              count: conversation.unreadCount,
            })}
          >
            {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
