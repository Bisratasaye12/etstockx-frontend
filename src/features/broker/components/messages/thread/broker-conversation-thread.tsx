"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { cn } from "@/shared/lib/utils";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button } from "@/shared/ui/button";
import type {
  ConversationDto,
  MessageDto,
} from "@/entities/messaging/model/types";
import { useConversations } from "@/features/messaging/api/use-conversations";
import { useConversationThread } from "@/features/messaging/api/use-conversation-thread";
import { useConversationSearch } from "@/features/messaging/api/use-conversation-search";
import { useSendMessage } from "@/features/messaging/api/use-send-message";
import { useUploadAttachment } from "@/features/messaging/api/use-upload-attachment";
import { useMarkConversationRead } from "@/features/messaging/api/use-mark-conversation-read";
import { groupMessagesByDay } from "@/features/messaging/lib/group-messages-by-day";
import {
  MessagingPortalProvider,
  usePortalThreadMessagesTranslations,
  type MessagingPortalId,
} from "@/features/messaging/context/messaging-portal-context";
import { ThreadHeader } from "@/features/broker/components/messages/thread/thread-header";
import { ThreadSearchBar } from "@/features/broker/components/messages/thread/thread-search-bar";
import { ThreadDaySeparator } from "@/features/broker/components/messages/thread/thread-day-separator";
import { ThreadMessageRow } from "@/features/broker/components/messages/thread/thread-message-row";
import { MessageComposer } from "@/features/broker/components/messages/thread/message-composer";

type Props = {
  conversationId: string;
  portal?: MessagingPortalId;
};

const EMPTY_MESSAGES: MessageDto[] = [];

/** Flattens infinite-query pages and flips backend "newest-first" to chronological. */
function chronologicalMessages(
  pages: Array<{ items: MessageDto[] | null }> | undefined,
): MessageDto[] {
  if (!pages || pages.length === 0) return EMPTY_MESSAGES;
  const flat: MessageDto[] = [];
  for (let i = pages.length - 1; i >= 0; i--) {
    const items = pages[i]?.items ?? [];
    for (let j = items.length - 1; j >= 0; j--) {
      flat.push(items[j]);
    }
  }
  return flat;
}

function findConversation(
  list: ConversationDto[] | null | undefined,
  id: string,
): ConversationDto | undefined {
  return list?.find((c) => c.id === id);
}

export function BrokerConversationThread({
  conversationId,
  portal = "broker",
}: Props) {
  return (
    <MessagingPortalProvider portal={portal}>
      <BrokerConversationThreadInner conversationId={conversationId} />
    </MessagingPortalProvider>
  );
}

function BrokerConversationThreadInner({
  conversationId,
}: {
  conversationId: string;
}) {
  const t = usePortalThreadMessagesTranslations();
  const locale = useLocale();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";

  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const threadQuery = useConversationThread({ conversationId });
  const conversationsQuery = useConversations({ page: 1, pageSize: 50 });

  const conversation = findConversation(
    conversationsQuery.data?.items,
    conversationId,
  );

  const markRead = useMarkConversationRead();
  useEffect(() => {
    if (!conversationId) return;
    markRead.mutate(conversationId);
    // Mark once per mount/conversation. `markRead` is a stable mutation object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const messages = useMemo(
    () => chronologicalMessages(threadQuery.data?.pages),
    [threadQuery.data?.pages],
  );

  const searchKeyword = searchActive ? searchQuery.trim() : "";
  const searchQueryResult = useConversationSearch({
    conversationId,
    keyword: searchKeyword,
    enabled: searchActive,
  });

  const sendMessage = useSendMessage();
  const uploadAttachment = useUploadAttachment();
  const isSending = sendMessage.isPending || uploadAttachment.isPending;
  const sendError = sendMessage.error ?? uploadAttachment.error;

  const groups = useMemo(() => groupMessagesByDay(messages), [messages]);

  // Auto-scroll to bottom on first load + when a new message arrives at the tail.
  const lastMessageId = messages.at(-1)?.id ?? null;
  useEffect(() => {
    if (searchActive) return;
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [lastMessageId, searchActive]);

  function handleToggleSearch() {
    setSearchActive((prev) => {
      const next = !prev;
      if (!next) setSearchQuery("");
      return next;
    });
  }

  async function handleSendText(content: string) {
    await sendMessage.mutateAsync({ conversationId, content });
  }

  async function handleSendAttachment(file: File, caption: string) {
    await uploadAttachment.mutateAsync({ conversationId, file, caption });
  }

  const isFirstLoad = threadQuery.isLoading && !threadQuery.data;
  const ownerSubtitle = conversation?.lastMessageAt
    ? t("activeNow")
    : t("noStatus");

  return (
    <div className="border-border bg-card flex h-[calc(100vh-7rem)] min-h-[560px] flex-col overflow-hidden rounded-xl border shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <ThreadHeader
        counterpartyName={conversation?.counterpartyName ?? null}
        subtitle={ownerSubtitle}
        online={Boolean(conversation?.lastMessageAt)}
        searchActive={searchActive}
        onToggleSearch={handleToggleSearch}
      />

      {searchActive ? (
        <ThreadSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClose={() => {
            setSearchActive(false);
            setSearchQuery("");
          }}
        />
      ) : null}

      <div
        className={cn(
          "flex-1 overflow-y-auto px-4 py-5 md:px-6",
          searchActive && "bg-muted/10",
        )}
      >
        {isFirstLoad ? (
          <p className="text-muted-foreground py-10 text-center text-sm">
            {t("loading")}
          </p>
        ) : threadQuery.isError ? (
          <p
            className="text-destructive py-10 text-center text-sm"
            role="alert"
          >
            {getApiErrorMessage(threadQuery.error)}
          </p>
        ) : searchActive ? (
          <SearchResults
            keyword={searchKeyword}
            results={searchQueryResult.data ?? EMPTY_MESSAGES}
            isLoading={searchQueryResult.isLoading}
            isError={searchQueryResult.isError}
            errorMessage={
              searchQueryResult.error
                ? getApiErrorMessage(searchQueryResult.error)
                : ""
            }
            currentUserId={currentUserId}
            counterpartyName={conversation?.counterpartyName ?? null}
            locale={locale}
          />
        ) : messages.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">
            {t("empty")}
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {threadQuery.hasNextPage ? (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={threadQuery.isFetchingNextPage}
                  onClick={() => threadQuery.fetchNextPage()}
                >
                  {threadQuery.isFetchingNextPage
                    ? t("loadingOlder")
                    : t("loadOlder")}
                </Button>
              </div>
            ) : null}

            {groups.map((group) => (
              <div key={group.key} className="flex flex-col gap-3">
                <ThreadDaySeparator group={group} locale={locale} />
                <div className="flex flex-col gap-2.5">
                  {group.items.map((m) => (
                    <ThreadMessageRow
                      key={m.id}
                      message={m}
                      ownership={
                        m.senderId === currentUserId ? "own" : "incoming"
                      }
                      counterpartyName={conversation?.counterpartyName ?? null}
                      locale={locale}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} aria-hidden />
          </div>
        )}
      </div>

      {sendError ? (
        <p
          className="text-destructive border-border border-t px-4 py-2 text-xs md:px-5"
          role="alert"
        >
          {getApiErrorMessage(sendError)}
        </p>
      ) : null}

      <MessageComposer
        isSending={isSending}
        onSendText={handleSendText}
        onSendAttachment={handleSendAttachment}
      />
    </div>
  );
}

function SearchResults({
  keyword,
  results,
  isLoading,
  isError,
  errorMessage,
  currentUserId,
  counterpartyName,
  locale,
}: {
  keyword: string;
  results: MessageDto[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  currentUserId: string;
  counterpartyName: string | null;
  locale: string;
}) {
  const t = usePortalThreadMessagesTranslations();

  if (!keyword) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        {t("searchPrompt")}
      </p>
    );
  }
  if (isLoading) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        {t("searchLoading")}
      </p>
    );
  }
  if (isError) {
    return (
      <p className="text-destructive py-10 text-center text-sm" role="alert">
        {errorMessage}
      </p>
    );
  }
  if (results.length === 0) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        {t("searchEmpty", { query: keyword })}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-muted-foreground text-center text-xs">
        {t("searchResultsCount", { count: results.length })}
      </p>
      {results.map((m) => (
        <ThreadMessageRow
          key={m.id}
          message={m}
          ownership={m.senderId === currentUserId ? "own" : "incoming"}
          counterpartyName={counterpartyName}
          locale={locale}
          searchKeyword={keyword}
        />
      ))}
    </div>
  );
}
