"use client";

import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { MessageDto } from "@/entities/messaging/model/types";
import { formatMessageTime } from "@/features/messaging/lib/format-message-time";
import { getConversationInitials } from "@/features/messaging/lib/conversation-initials";
import { usePortalThreadMessagesTranslations } from "@/features/messaging/context/messaging-portal-context";
import { ThreadAttachmentCard } from "@/features/broker/components/messages/thread/thread-attachment-card";
import { HighlightedText } from "@/features/broker/components/messages/thread/highlighted-text";

type Props = {
  message: MessageDto;
  ownership: "own" | "incoming";
  counterpartyName: string | null;
  locale: string;
  /** When non-empty, the bubble renders its text with yellow keyword highlights. */
  searchKeyword?: string;
};

export function ThreadMessageRow({
  message,
  ownership,
  counterpartyName,
  locale,
  searchKeyword = "",
}: Props) {
  const t = usePortalThreadMessagesTranslations();

  const isOwn = ownership === "own";
  const time = formatMessageTime(message.sentAt, locale);
  const isRead = Boolean(message.readAt);

  const initials = getConversationInitials(
    isOwn ? t("youLabel") : (message.senderName ?? counterpartyName),
  );

  const attachments = message.attachments ?? [];
  const hasContent = Boolean(
    message.content && message.content.trim().length > 0,
  );
  const hasAttachments = attachments.length > 0;

  return (
    <div
      className={cn(
        "flex items-start gap-2.5",
        isOwn ? "justify-end" : "justify-start",
      )}
    >
      {!isOwn ? (
        <span
          aria-hidden
          className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
        >
          {initials}
        </span>
      ) : null}

      <div
        className={cn(
          "flex max-w-[min(78%,560px)] flex-col gap-1.5",
          isOwn ? "items-end" : "items-start",
        )}
      >
        {hasContent ? (
          <div
            className={cn(
              "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
              isOwn
                ? "bg-primary text-primary-foreground"
                : "bg-muted/70 text-foreground",
            )}
          >
            {searchKeyword ? (
              <HighlightedText
                text={message.content ?? ""}
                keyword={searchKeyword}
              />
            ) : (
              message.content
            )}
          </div>
        ) : null}

        {hasAttachments ? (
          <div className="flex flex-col gap-1.5">
            {attachments.map((a) => (
              <ThreadAttachmentCard
                key={a.id}
                attachment={a}
                ownership={ownership}
              />
            ))}
          </div>
        ) : null}

        <div
          className={cn(
            "text-muted-foreground inline-flex items-center gap-1 text-[11px]",
            isOwn ? "self-end" : "self-start",
          )}
        >
          <span className="tabular-nums">{time}</span>
          {isOwn ? (
            isRead ? (
              <CheckCheck
                className="text-primary size-3.5"
                aria-label={t("read")}
              />
            ) : (
              <Check className="size-3.5" aria-label={t("sent")} />
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
