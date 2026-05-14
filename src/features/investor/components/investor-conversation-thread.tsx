"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Paperclip,
  Search,
  Send,
  Sheet,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/shared/i18n/routing";
import { browserApi } from "@/shared/api/browser-api";
import type { InvestorMessageDto } from "@/features/investor/model/messaging";
import { useBrokerDirectory } from "@/features/profiles/api/use-broker-directory";
import { useInvestorConversations } from "@/features/investor/api/use-investor-conversations";
import {
  mergeMessagePagesChronological,
  useInvestorConversationMessages,
} from "@/features/investor/api/use-investor-conversation-messages";
import { downloadInvestorMessageAttachment } from "@/features/investor/api/download-message-attachment";
import { investorKeys } from "@/features/investor/api/keys";
import { formatMessageFileSize } from "@/features/investor/lib/format-message-file-size";
import {
  investorBrokerAvatarLabel,
  investorBrokerTitle,
} from "@/features/investor/lib/messaging-broker-label";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/utils";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function calendarDayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isTodayLocal(iso: string): boolean {
  return isSameLocalDay(new Date(iso), new Date());
}

function HighlightedText({ text, needle }: { text: string; needle: string }) {
  const n = needle.trim();
  if (!n) return <>{text}</>;
  const re = new RegExp(`(${escapeRegExp(n)})`, "gi");
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === n.toLowerCase() ? (
          <mark
            key={i}
            className="rounded-sm bg-[#ffeb3b]/90 px-0.5 text-inherit dark:bg-[#fbc02d]/80"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function AttachmentRow({
  att,
  onDownload,
  disabled,
  invert,
}: {
  att: NonNullable<InvestorMessageDto["attachments"]>[number];
  onDownload: () => void;
  disabled: boolean;
  invert?: boolean;
}) {
  const name = (att.fileName ?? "file").toLowerCase();
  const isPdf = name.endsWith(".pdf") || att.fileType?.includes("pdf");
  const isSheet =
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    att.fileType?.includes("sheet") ||
    att.fileType?.includes("excel");

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onDownload}
      className={cn(
        "flex w-full max-w-sm items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
        invert
          ? "border-primary-foreground/25 bg-primary-foreground/10 hover:border-primary-foreground/40"
          : "border-border/80 bg-background/80 hover:border-primary/40",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          invert && "bg-primary-foreground/15 text-primary-foreground",
          !invert && isPdf && "bg-red-500/10 text-red-600",
          !invert && isSheet && "bg-emerald-500/10 text-emerald-600",
          !invert && !isPdf && !isSheet && "bg-primary/10 text-primary",
        )}
      >
        {isSheet ? (
          <Sheet className="size-5" aria-hidden />
        ) : (
          <FileText className="size-5" aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate font-semibold",
            invert ? "text-primary-foreground" : "text-primary",
          )}
        >
          {att.fileName ?? "—"}
        </span>
        <span
          className={cn(
            "text-xs",
            invert ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {formatMessageFileSize(att.sizeBytes)}
        </span>
      </span>
    </button>
  );
}

type Props = {
  conversationId: string;
};

export function InvestorConversationThread({ conversationId }: Props) {
  const t = useTranslations("investor.messages");
  const router = useRouter();
  const qc = useQueryClient();
  const { data: session } = useSession();
  const myUserId = session?.user?.id ?? "";

  const validId = UUID_RE.test(conversationId);

  const { data: conversations } = useInvestorConversations(validId);
  const conversationRow = useMemo(
    () => (conversations ?? []).find((c) => c.id === conversationId),
    [conversations, conversationId],
  );
  const counterpartyId = conversationRow?.counterpartyId ?? "";

  const { data: brokers } = useBrokerDirectory();
  const broker = useMemo(
    () =>
      counterpartyId
        ? (brokers ?? []).find((b) => b.userId === counterpartyId)
        : undefined,
    [brokers, counterpartyId],
  );

  const title = investorBrokerTitle(broker, t("unknownCounterparty"));
  const avatarLetter = investorBrokerAvatarLabel(broker, title);

  const messagesQ = useInvestorConversationMessages(conversationId, validId);
  const chronological = useMemo(
    () => mergeMessagePagesChronological(messagesQ.data?.pages ?? []),
    [messagesQ.data?.pages],
  );

  const [searchDraft, setSearchDraft] = useState("");
  const [searchQ, setSearchQ] = useState("");
  useEffect(() => {
    const id = window.setTimeout(() => setSearchQ(searchDraft.trim()), 350);
    return () => window.clearTimeout(id);
  }, [searchDraft]);

  const searchEnabled = validId && searchQ.length >= 2;
  const [searchCount, setSearchCount] = useState<number | null>(null);
  const [searchFetching, setSearchFetching] = useState(false);

  useEffect(() => {
    if (!searchEnabled) {
      setSearchCount(null);
      setSearchFetching(false);
      return;
    }
    let cancelled = false;
    setSearchFetching(true);
    void browserApi
      .get<InvestorMessageDto[]>(
        `/v1/messages/conversations/${conversationId}/search`,
        { params: { keyword: searchQ, limit: 50 } },
      )
      .then(({ data }) => {
        if (!cancelled) setSearchCount((data ?? []).length);
      })
      .catch(() => {
        if (!cancelled) setSearchCount(null);
      })
      .finally(() => {
        if (!cancelled) setSearchFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId, searchEnabled, searchQ]);

  const readMarkedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!validId) return;
    if (readMarkedFor.current === conversationId) return;
    readMarkedFor.current = conversationId;
    void browserApi
      .post(`/v1/messages/conversations/${conversationId}/read`)
      .then(() => {
        void qc.invalidateQueries({
          queryKey: investorKeys.conversationsList(),
        });
        void qc.invalidateQueries({
          queryKey: investorKeys.conversationsUnread(),
        });
      })
      .catch(() => {
        readMarkedFor.current = null;
      });
  }, [conversationId, validId, qc]);

  const [body, setBody] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileCaption, setFileCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const shouldStickBottom = useRef(true);

  const sendText = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await browserApi.post<InvestorMessageDto>(
        "/v1/messages",
        { conversationId, content },
      );
      return data;
    },
    onSuccess: () => {
      setBody("");
      shouldStickBottom.current = true;
      void qc.invalidateQueries({
        queryKey: investorKeys.conversationMessages(conversationId),
      });
      void qc.invalidateQueries({ queryKey: investorKeys.conversationsList() });
      void qc.invalidateQueries({
        queryKey: investorKeys.conversationsUnread(),
      });
    },
  });

  const sendAttachment = useMutation({
    mutationFn: async (payload: { file: File; caption: string }) => {
      const fd = new FormData();
      fd.append("file", payload.file);
      if (payload.caption.trim()) fd.append("caption", payload.caption.trim());
      const { data } = await browserApi.post<InvestorMessageDto>(
        `/v1/messages/conversations/${conversationId}/attachments`,
        fd,
      );
      return data;
    },
    onSuccess: () => {
      setPendingFile(null);
      setFileCaption("");
      setBody("");
      shouldStickBottom.current = true;
      void qc.invalidateQueries({
        queryKey: investorKeys.conversationMessages(conversationId),
      });
      void qc.invalidateQueries({ queryKey: investorKeys.conversationsList() });
      void qc.invalidateQueries({
        queryKey: investorKeys.conversationsUnread(),
      });
    },
  });

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const onDownload = useCallback(
    async (attachmentId: string, fileName: string) => {
      setDownloadingId(attachmentId);
      try {
        await downloadInvestorMessageAttachment(attachmentId, fileName);
      } finally {
        setDownloadingId(null);
      }
    },
    [],
  );

  const handleSubmit = () => {
    if (pendingFile) {
      const cap = [fileCaption.trim(), body.trim()]
        .filter(Boolean)
        .join("\n\n");
      sendAttachment.mutate({ file: pendingFile, caption: cap });
      return;
    }
    const text = body.trim();
    if (!text) return;
    sendText.mutate(text);
  };

  const highlightNeedle = searchQ.length >= 2 && !searchFetching ? searchQ : "";

  useLayoutEffect(() => {
    if (!shouldStickBottom.current) return;
    endRef.current?.scrollIntoView({ block: "end" });
  }, [chronological.length, sendText.isSuccess, sendAttachment.isSuccess]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldStickBottom.current = gap < 80;
  };

  const timeLabel = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });

  const dateLabel = (iso: string) => {
    if (isTodayLocal(iso)) return t("today");
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!validId) {
    return (
      <div className="border-border/80 bg-card mx-auto max-w-lg rounded-2xl border p-8 text-center shadow-sm">
        <p className="text-muted-foreground text-sm">{t("notFound")}</p>
        <Link
          href="/messages"
          className={cn(
            buttonVariants({ variant: "default" }),
            "mt-4 inline-flex h-10 items-center justify-center rounded-full px-6 font-semibold",
          )}
        >
          {t("backToInbox")}
        </Link>
      </div>
    );
  }

  if (messagesQ.isError) {
    return (
      <div className="border-border/80 bg-card mx-auto max-w-lg rounded-2xl border p-8 text-center shadow-sm">
        <p className="text-destructive text-sm" role="alert">
          {getApiErrorMessage(messagesQ.error)}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/messages")}
        >
          {t("backToInbox")}
        </Button>
      </div>
    );
  }

  const busy =
    sendText.isPending ||
    sendAttachment.isPending ||
    messagesQ.isLoading ||
    messagesQ.isFetching;

  const dayBreaks = new Set<string>();
  let prevDay = "";
  for (const m of chronological) {
    const k = calendarDayKey(m.sentAt);
    if (k !== prevDay) {
      dayBreaks.add(m.id);
      prevDay = k;
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs font-medium">
            <Link
              href="/messages"
              className="hover:text-foreground transition-colors"
            >
              {t("breadcrumb")}
            </Link>
            <span aria-hidden>/</span>
            <span className="text-foreground truncate">{title}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {title}
            </h1>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground -ml-1 shrink-0 gap-1.5 lg:hidden"
              onClick={() => router.push("/messages")}
            >
              <ArrowLeft className="size-4" aria-hidden />
              {t("back")}
            </Button>
          </div>
        </div>
        {counterpartyId ? (
          <Link
            href={`/brokers/${counterpartyId}`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-9 shrink-0 rounded-full px-4 text-sm font-semibold",
            )}
          >
            {t("viewBroker")}
          </Link>
        ) : null}
      </div>

      <div className="border-border/80 bg-card flex min-h-[min(70vh,720px)] flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm">
        <div className="border-border/60 flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative min-w-0 flex-1">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-10 rounded-full pr-24 pl-10"
              aria-label={t("searchPlaceholder")}
            />
            {searchDraft.trim().length > 0 ? (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1"
                onClick={() => {
                  setSearchDraft("");
                  setSearchQ("");
                }}
                aria-label={t("clearSearch")}
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
          {searchEnabled ? (
            <p className="text-muted-foreground shrink-0 text-xs sm:text-sm">
              {searchFetching ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  {t("searching")}
                </span>
              ) : (
                t("resultsFound", { count: searchCount ?? 0 })
              )}
            </p>
          ) : searchDraft.trim().length > 0 && searchDraft.trim().length < 2 ? (
            <p className="text-muted-foreground text-xs">
              {t("searchMinChars")}
            </p>
          ) : null}
        </div>

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="bg-muted/15 flex flex-1 flex-col overflow-y-auto px-3 py-4 sm:px-5"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3">
            {messagesQ.hasNextPage ? (
              <div className="flex justify-center pb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={messagesQ.isFetchingNextPage}
                  onClick={() => {
                    shouldStickBottom.current = false;
                    void messagesQ.fetchNextPage();
                  }}
                >
                  {messagesQ.isFetchingNextPage ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      {t("loadingOlder")}
                    </>
                  ) : (
                    t("loadOlder")
                  )}
                </Button>
              </div>
            ) : null}

            {messagesQ.isLoading ? (
              <div className="text-muted-foreground flex flex-1 items-center justify-center gap-2 py-20 text-sm">
                <Loader2 className="size-5 animate-spin" aria-hidden />
                {t("loadingThread")}
              </div>
            ) : chronological.length === 0 ? (
              <p className="text-muted-foreground py-16 text-center text-sm">
                {t("threadEmpty")}
              </p>
            ) : (
              chronological.map((m) => {
                const mine = Boolean(myUserId && m.senderId === myUserId);
                const showDay = dayBreaks.has(m.id);
                const atts = m.attachments ?? [];

                return (
                  <div key={m.id}>
                    {showDay ? (
                      <div className="flex justify-center py-3">
                        <span className="bg-background text-muted-foreground border-border/60 rounded-full border px-4 py-1 text-xs font-medium shadow-sm">
                          {dateLabel(m.sentAt)}
                        </span>
                      </div>
                    ) : null}
                    <div
                      className={cn(
                        "flex gap-2.5 sm:gap-3",
                        mine && "flex-row-reverse",
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          mine
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground",
                        )}
                        aria-hidden
                      >
                        {mine ? t("youBadge") : avatarLetter}
                      </div>
                      <div
                        className={cn(
                          "flex min-w-0 max-w-[min(100%,520px)] flex-col gap-1",
                          mine && "items-end",
                        )}
                      >
                        <div
                          className={cn(
                            "text-muted-foreground flex flex-wrap gap-x-2 text-xs",
                            mine && "flex-row-reverse",
                          )}
                        >
                          {mine ? (
                            <>
                              <span className="font-medium text-foreground">
                                {t("you")}
                              </span>
                              <span>{timeLabel(m.sentAt)}</span>
                            </>
                          ) : (
                            <>
                              <span className="font-medium text-foreground">
                                {title}
                              </span>
                              <span>{timeLabel(m.sentAt)}</span>
                            </>
                          )}
                        </div>
                        <div
                          className={cn(
                            "space-y-2 rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                            mine
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-muted/80 border-border/60 rounded-tl-sm border",
                          )}
                        >
                          {m.content ? (
                            <p className="whitespace-pre-wrap break-words">
                              <HighlightedText
                                text={m.content}
                                needle={highlightNeedle}
                              />
                            </p>
                          ) : null}
                          {atts.length > 0 ? (
                            <div className="space-y-2">
                              {atts.map((a) => (
                                <AttachmentRow
                                  key={a.id}
                                  att={a}
                                  invert={mine}
                                  disabled={downloadingId === a.id}
                                  onDownload={() =>
                                    void onDownload(
                                      a.id,
                                      a.fileName ?? "download",
                                    )
                                  }
                                />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={endRef} className="h-px shrink-0" aria-hidden />
          </div>
        </div>

        <div className="border-border/60 bg-card border-t px-3 py-3 sm:px-4">
          {pendingFile ? (
            <div className="border-border/60 bg-muted/20 mb-2 rounded-xl border px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {pendingFile.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatMessageFileSize(pendingFile.size)}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground shrink-0 rounded-full p-1"
                  onClick={() => {
                    setPendingFile(null);
                    setFileCaption("");
                  }}
                  aria-label={t("removeFile")}
                >
                  <X className="size-4" />
                </button>
              </div>
              <Input
                value={fileCaption}
                onChange={(e) => setFileCaption(e.target.value)}
                placeholder={t("captionPlaceholder")}
                className="mt-2 h-9 rounded-lg"
              />
            </div>
          ) : null}
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xlsx,.xls,.jpeg,.jpg,.png"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPendingFile(f);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground shrink-0 rounded-full"
              aria-label={t("attachFile")}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="size-5" />
            </Button>
            <Input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!busy) handleSubmit();
                }
              }}
              placeholder={t("typingPlaceholder")}
              className="min-h-10 flex-1 rounded-full px-4"
            />
            <Button
              type="button"
              size="icon-lg"
              className="shrink-0 rounded-full"
              disabled={
                busy ||
                (!pendingFile && !body.trim()) ||
                (pendingFile !== null && pendingFile.size > 10 * 1024 * 1024)
              }
              aria-label={t("send")}
              onClick={() => void handleSubmit()}
            >
              {busy ? (
                <Loader2 className="size-5 animate-spin" aria-hidden />
              ) : (
                <Send className="size-5" aria-hidden />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
