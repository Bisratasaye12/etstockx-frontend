"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { ChevronRight, Loader2, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { useInvestorConversations } from "@/features/investor/api/use-investor-conversations";
import { useBrokerDirectory } from "@/features/profiles/api/use-broker-directory";
import {
  investorBrokerAvatarLabel,
  investorBrokerTitle,
} from "@/features/investor/lib/messaging-broker-label";
import { formatConversationListTime } from "@/features/investor/lib/format-conversation-list-time";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export function InvestorMessagesPanel() {
  const t = useTranslations("investor.messages");
  const { status } = useSession();
  const enabled = status === "authenticated";

  const q = useInvestorConversations(enabled);
  const { data: brokers } = useBrokerDirectory();

  const rows = useMemo(() => {
    const list = [...(q.data ?? [])];
    list.sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    });
    return list;
  }, [q.data]);

  if (status === "loading" || (enabled && q.isLoading)) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center gap-2 text-sm">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        {t("loading")}
      </div>
    );
  }

  if (q.isError) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {getApiErrorMessage(q.error)}
      </p>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
          {t("subtitle")}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="flex justify-center px-2">
          <div className="border-border/80 bg-card w-full max-w-md rounded-2xl border px-8 py-14 text-center shadow-md">
            <div className="bg-primary/10 mx-auto mb-5 flex size-16 items-center justify-center rounded-full">
              <MessageSquare
                className="text-primary size-8 stroke-[1.5]"
                aria-hidden
              />
            </div>
            <h2 className="text-foreground text-lg font-semibold tracking-tight">
              {t("emptyTitle")}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {t("emptyBody")}
            </p>
            <Link
              href="/brokers"
              className={cn(
                buttonVariants({ variant: "default" }),
                "mt-6 inline-flex h-11 items-center justify-center rounded-full px-8 text-sm font-semibold",
              )}
            >
              {t("findBroker")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="border-border/80 bg-card overflow-hidden rounded-2xl border shadow-sm">
          <ul className="divide-border/60 divide-y">
            {rows.map((c) => {
              const broker = (brokers ?? []).find(
                (b) => b.userId === c.counterpartyId,
              );
              const title = investorBrokerTitle(
                broker,
                t("unknownCounterparty"),
              );
              const initials = investorBrokerAvatarLabel(broker, title);
              const preview = c.lastMessagePreview?.trim() || t("noPreview");
              const when = c.lastMessageAt
                ? formatConversationListTime(c.lastMessageAt, t)
                : null;

              return (
                <li key={c.id}>
                  <Link
                    href={`/messages/${c.id}`}
                    className="hover:bg-muted/40 flex items-center gap-4 px-4 py-4 transition-colors sm:px-5"
                  >
                    <div
                      className="bg-primary/12 text-primary flex size-11 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      aria-hidden
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-semibold">{title}</p>
                        {when ? (
                          <time
                            className="text-muted-foreground shrink-0 text-xs"
                            dateTime={c.lastMessageAt ?? undefined}
                          >
                            {when}
                          </time>
                        ) : null}
                      </div>
                      <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">
                        {preview}
                      </p>
                    </div>
                    {c.unreadCount > 0 ? (
                      <span className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                        {c.unreadCount > 99 ? "99+" : c.unreadCount}
                      </span>
                    ) : (
                      <ChevronRight
                        className="text-muted-foreground size-5 shrink-0"
                        aria-hidden
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
