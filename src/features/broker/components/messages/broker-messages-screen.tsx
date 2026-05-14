"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { useLocale } from "next-intl";
import { useConversations } from "@/features/messaging/api/use-conversations";
import {
  MessagingPortalProvider,
  useMessagingPortal,
  usePortalListMessagesTranslations,
  type MessagingPortalId,
} from "@/features/messaging/context/messaging-portal-context";
import { ConversationListItem } from "@/features/broker/components/messages/conversation-list-item";
import { EmptyConversationsState } from "@/features/broker/components/messages/empty-conversations-state";
import { NewMessageDialog } from "@/features/broker/components/messages/new-message-dialog";
import type { ConversationDto } from "@/entities/messaging/model/types";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

const PAGE_SIZE = 8;

/** Stable reference so `useMemo` deps don't flip on every render. */
const EMPTY_CONVERSATIONS: ConversationDto[] = [];

type Props = {
  /** Conversation currently being viewed (from the URL), if any. */
  activeConversationId?: string;
  /** Investor shell reuses the same list UI under `/messages`. */
  portal?: MessagingPortalId;
};

const panelSurface =
  "rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06)]";

function filterByQuery(items: ConversationDto[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((c) => {
    const name = (c.counterpartyName ?? "").toLowerCase();
    const preview = (c.lastMessagePreview ?? "").toLowerCase();
    return name.includes(q) || preview.includes(q);
  });
}

function BrokerMessagesScreenInner({ activeConversationId }: Props) {
  const t = usePortalListMessagesTranslations();
  const { portal } = useMessagingPortal();
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);

  const listQuery = useConversations({ page, pageSize: PAGE_SIZE });

  const allItems = listQuery.data?.items ?? EMPTY_CONVERSATIONS;
  const visibleItems = useMemo(
    () => filterByQuery(allItems, query),
    [allItems, query],
  );

  const unreadTotal = useMemo(
    () => allItems.reduce((acc, c) => acc + (c.unreadCount ?? 0), 0),
    [allItems],
  );

  const totalPages = Math.max(1, listQuery.data?.totalPages ?? 1);
  const isFirstLoad = listQuery.isLoading && !listQuery.data;
  const isEmpty = !isFirstLoad && allItems.length === 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {unreadTotal > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-amber-500"
              />
              {t("unreadBadge", { count: unreadTotal })}
            </span>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setComposeOpen(true)}
            aria-label={t("newMessage")}
          >
            <Plus className="size-4" aria-hidden />
            {t("newMessage")}
          </Button>
        </div>
      </header>

      <NewMessageDialog open={composeOpen} onOpenChange={setComposeOpen} />

      {!isEmpty ? (
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="border-border bg-card h-11 rounded-xl pl-10 shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
          />
        </div>
      ) : null}

      {listQuery.isError ? (
        <p className="text-destructive text-sm" role="alert">
          {getApiErrorMessage(listQuery.error)}
        </p>
      ) : null}

      <div className={cn(panelSurface, "overflow-hidden")}>
        {isFirstLoad ? (
          <p className="text-muted-foreground px-5 py-10 text-sm">
            {t("listLoading")}
          </p>
        ) : isEmpty ? (
          <EmptyConversationsState
            footer={
              portal === "investor" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-6 gap-1.5"
                  onClick={() => setComposeOpen(true)}
                  aria-label={t("newMessage")}
                >
                  <Plus className="size-4" aria-hidden />
                  {t("newMessage")}
                </Button>
              ) : null
            }
          />
        ) : visibleItems.length === 0 ? (
          <p className="text-muted-foreground px-5 py-10 text-sm">
            {t("searchEmpty", { query })}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {visibleItems.map((c) => (
              <ConversationListItem
                key={c.id}
                conversation={c}
                isActive={c.id === activeConversationId}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>

      {!isEmpty && totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || listQuery.isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="mr-1 size-4" aria-hidden />
            {t("previous")}
          </Button>
          <span className="text-muted-foreground text-sm">
            {t("pageIndicator", { page, totalPages })}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || listQuery.isFetching}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t("next")}
            <ChevronRight className="ml-1 size-4" aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function BrokerMessagesScreen({
  activeConversationId,
  portal = "broker",
}: Props) {
  return (
    <MessagingPortalProvider portal={portal}>
      <BrokerMessagesScreenInner activeConversationId={activeConversationId} />
    </MessagingPortalProvider>
  );
}
