"use client";

import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { browserApi } from "@/shared/api/browser-api";
import { cn } from "@/shared/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { getApiErrorMessage } from "@/shared/lib/api-error";

type ConversationDto = {
  id: string;
  counterpartyId: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

type Paged<T> = {
  items: T[] | null;
  total: number;
};

export function InvestorMessagesPanel() {
  const t = useTranslations("investor.messages");

  const q = useQuery({
    queryKey: ["messages", "conversations", "list"],
    queryFn: async () => {
      const { data } = await browserApi.get<Paged<ConversationDto>>(
        "/v1/messages/conversations",
        { params: { page: 1, pageSize: 50 } },
      );
      return data.items ?? [];
    },
  });

  if (q.isLoading) {
    return <p className="text-muted-foreground text-sm">{t("loading")}</p>;
  }

  if (q.isError) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {getApiErrorMessage(q.error)}
      </p>
    );
  }

  const rows = q.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {rows.length === 0 ? (
        <div className="border-muted-foreground/25 bg-muted/15 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-16 text-center">
          <MessageSquare
            className="text-muted-foreground size-10"
            aria-hidden
          />
          <p className="text-muted-foreground max-w-md text-sm">{t("empty")}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((c) => (
            <Card key={c.id} className="border-border/80 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base font-semibold">
                    {t("conversationWith", {
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
                    {new Date(c.lastMessageAt).toLocaleString()}
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
