"use client";

import { useMemo, useState } from "react";
import { Building2, Search, User, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Modal } from "@/shared/ui/modal";
import { Textarea } from "@/shared/ui/textarea";
import type { BrokerDirectoryEntry } from "@/shared/api/types";
import type { BrokerClientListRow } from "@/entities/broker/model/types";
import { useBrokerIncomingRequests } from "@/features/broker/api/use-broker-incoming-requests";
import { useBrokerDirectory } from "@/features/profiles/api/use-broker-directory";
import { uniqueClientsFromIncoming } from "@/features/broker/lib/unique-clients-from-incoming";
import { useSendMessage } from "@/features/messaging/api/use-send-message";
import { getConversationInitials } from "@/features/messaging/lib/conversation-initials";

type RecipientKind = "client" | "broker";

type Recipient = {
  kind: RecipientKind;
  userId: string;
  primaryLabel: string;
  secondaryLabel: string | null;
  /** When false (brokers with `isAcceptingRequests=false`), the row is shown but disabled. */
  isSelectable: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const INCOMING_PAGE_SIZE = 200;

function clientToRecipient(c: BrokerClientListRow): Recipient {
  return {
    kind: "client",
    userId: c.clientId,
    primaryLabel: c.displayName,
    secondaryLabel: null,
    isSelectable: true,
  };
}

function brokerToRecipient(
  b: BrokerDirectoryEntry,
  fallbackLabel: string,
): Recipient {
  return {
    kind: "broker",
    userId: b.userId,
    primaryLabel: b.institution?.trim() || fallbackLabel,
    secondaryLabel: b.licenseDisplay?.trim() || null,
    isSelectable: b.isAcceptingRequests,
  };
}

function matchesQuery(r: Recipient, q: string): boolean {
  if (!q) return true;
  const haystack = `${r.primaryLabel} ${r.secondaryLabel ?? ""}`.toLowerCase();
  return haystack.includes(q);
}

export function NewMessageDialog({ open, onOpenChange }: Props) {
  const t = useTranslations("broker.messages.compose");
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";

  const [tab, setTab] = useState<RecipientKind>("client");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Recipient | null>(null);
  const [content, setContent] = useState("");

  const incoming = useBrokerIncomingRequests(1, INCOMING_PAGE_SIZE);
  const directory = useBrokerDirectory();
  const sendMessage = useSendMessage();

  const clientRecipients = useMemo<Recipient[]>(
    () =>
      uniqueClientsFromIncoming(incoming.data?.items ?? null).map(
        clientToRecipient,
      ),
    [incoming.data?.items],
  );

  const brokerRecipients = useMemo<Recipient[]>(() => {
    const fallback = t("brokerUnnamed");
    const all = (directory.data ?? []).map((b) =>
      brokerToRecipient(b, fallback),
    );
    return all.filter((r) => r.userId !== currentUserId);
  }, [directory.data, currentUserId, t]);

  const list = tab === "client" ? clientRecipients : brokerRecipients;
  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => list.filter((r) => matchesQuery(r, q)),
    [list, q],
  );

  const activeQuery = tab === "client" ? incoming : directory;
  const trimmedContent = content.trim();
  const canSend =
    selected != null &&
    selected.isSelectable &&
    trimmedContent.length > 0 &&
    !sendMessage.isPending;

  function resetState() {
    setTab("client");
    setQuery("");
    setSelected(null);
    setContent("");
    sendMessage.reset();
  }

  function handleClose() {
    if (sendMessage.isPending) return;
    resetState();
    onOpenChange(false);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend || !selected) return;
    try {
      const message = await sendMessage.mutateAsync({
        recipientId: selected.userId,
        content: trimmedContent,
      });
      resetState();
      onOpenChange(false);
      router.push(`/dashboard/broker/messages/${message.conversationId}`);
    } catch {
      // surfaced via sendMessage.error below
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
        else onOpenChange(true);
      }}
      closeOnBackdrop={!sendMessage.isPending}
      className="max-w-xl p-0"
    >
      <form onSubmit={handleSend} className="flex flex-col">
        <div className="border-border flex items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 className="text-foreground text-lg font-semibold">
              {t("title")}
            </h2>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {t("subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label={t("close")}
            disabled={sendMessage.isPending}
            className="text-muted-foreground hover:bg-muted/60 hover:text-foreground inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="border-border space-y-3 border-b px-5 py-4">
          <div className="bg-muted/60 inline-flex rounded-lg p-0.5">
            {(["client", "broker"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setTab(key);
                  setSelected(null);
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {key === "client" ? t("tabs.clients") : t("tabs.brokers")}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search
              aria-hidden
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                tab === "client"
                  ? t("searchClientsPlaceholder")
                  : t("searchBrokersPlaceholder")
              }
              aria-label={t("searchAria")}
              className="border-border bg-background h-10 rounded-lg pl-10"
            />
          </div>

          <div
            className="border-border max-h-[260px] min-h-[180px] overflow-y-auto rounded-lg border"
            role="listbox"
            aria-label={t("recipientListAria")}
          >
            {activeQuery.isLoading ? (
              <p className="text-muted-foreground px-4 py-6 text-sm">
                {t("loading")}
              </p>
            ) : activeQuery.isError ? (
              <p className="text-destructive px-4 py-6 text-sm" role="alert">
                {getApiErrorMessage(activeQuery.error)}
              </p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground px-4 py-6 text-sm">
                {tab === "client" ? t("emptyClients") : t("emptyBrokers")}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((r) => {
                  const isActive =
                    selected?.userId === r.userId && selected?.kind === r.kind;
                  return (
                    <li key={`${r.kind}-${r.userId}`}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        disabled={!r.isSelectable}
                        onClick={() => setSelected(r)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          r.isSelectable
                            ? "hover:bg-muted/50"
                            : "cursor-not-allowed opacity-60",
                          isActive && "bg-primary/[0.08]",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                            r.kind === "client"
                              ? "bg-sky-100 text-sky-700"
                              : "bg-violet-100 text-violet-700",
                          )}
                        >
                          {r.kind === "client" ? (
                            getConversationInitials(r.primaryLabel)
                          ) : (
                            <Building2 className="size-4" />
                          )}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="text-foreground truncate text-sm font-medium">
                            {r.primaryLabel}
                          </span>
                          <span className="text-muted-foreground inline-flex items-center gap-1.5 truncate text-xs">
                            {r.kind === "broker" ? (
                              <Building2
                                className="size-3 shrink-0"
                                aria-hidden
                              />
                            ) : (
                              <User className="size-3 shrink-0" aria-hidden />
                            )}
                            {r.secondaryLabel ??
                              (r.kind === "client"
                                ? t("kindClient")
                                : t("kindBroker"))}
                            {!r.isSelectable ? (
                              <span className="text-amber-700">
                                · {t("notAcceptingRequests")}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-2 px-5 py-4">
          <label
            htmlFor="new-message-content"
            className="text-foreground block text-sm font-medium"
          >
            {t("messageLabel")}
          </label>
          <Textarea
            id="new-message-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("messagePlaceholder")}
            rows={4}
            disabled={sendMessage.isPending}
            className="min-h-[96px]"
          />
          {selected ? (
            <p className="text-muted-foreground text-xs">
              {t("sendingTo", { name: selected.primaryLabel })}
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">
              {t("selectRecipientHint")}
            </p>
          )}
        </div>

        {sendMessage.isError ? (
          <p
            className="text-destructive border-border border-t px-5 py-2 text-xs"
            role="alert"
          >
            {getApiErrorMessage(sendMessage.error)}
          </p>
        ) : null}

        <div className="border-border bg-muted/30 flex items-center justify-end gap-2 border-t px-5 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={sendMessage.isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!canSend}
            aria-disabled={!canSend}
          >
            {sendMessage.isPending ? t("sending") : t("send")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
