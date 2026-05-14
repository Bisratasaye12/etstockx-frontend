"use client";

import { Loader2, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { buttonVariants } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";
import { formatConversationListTime } from "@/features/investor/lib/format-conversation-list-time";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { useConversations } from "@/features/messaging/api/use-conversations";

export function InvestorMessagesPanel() {
  const t = useTranslations("investor.messages");

  const q = useConversations({ page: 1, pageSize: 50 });

  if (q.isLoading) {
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

  const rows = q.data?.items ?? [];

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
        <div className="grid gap-3">
          {rows.map((c) => (
            <Card key={c.id} className="border-border/80 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base font-semibold">
                    {c.counterpartyName?.trim() ||
                      t("conversationWith", {
                        id: c.counterpartyId.slice(0, 8),
                      })}
                  </CardTitle>
                  {c.unreadCount > 0 ? (
                    <span
                      className={cn(
                        "bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-semibold",
                      )}
                    >
                      {c.unreadCount}
                    </span>
                  ) : null}
                </div>
                {c.lastMessageAt ? (
                  <CardDescription>
                    {formatConversationListTime(c.lastMessageAt, t)}
                  </CardDescription>
                ) : null}
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {c.lastMessagePreview ?? t("noPreview")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
