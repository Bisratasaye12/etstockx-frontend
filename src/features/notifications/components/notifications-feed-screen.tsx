"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { NotificationItem } from "@/entities/notification/model/types";
import { formatRelativeTimeShort } from "@/shared/lib/format-relative-time";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { useNotificationUnreadCount } from "@/features/notifications/api/use-notification-unread-count";
import { useNotificationsPaged } from "@/features/notifications/api/use-notifications-paged";
import { useMarkAllNotificationsRead } from "@/features/notifications/api/use-mark-all-notifications-read";
import { useMarkNotificationRead } from "@/features/notifications/api/use-mark-notification-read";
import { groupNotificationsByCalendarDay } from "@/features/notifications/lib/group-notifications-by-calendar-day";

const panelSurface =
  "rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06)]";

type StatusTab = "all" | "unread" | "read";
type ChannelFilter = "" | "InApp" | "Email" | "Sms" | "Push";

function channelTagClass(channel: string | null | undefined): string {
  const c = (channel ?? "").toLowerCase();
  if (c === "inapp" || c === "1")
    return "bg-primary/10 text-primary border-primary/15";
  return "bg-muted text-muted-foreground border-border";
}

function formatChannelLabel(
  channel: string | null | undefined,
  t: (key: string) => string,
): string {
  const c = (channel ?? "").toLowerCase();
  if (c === "inapp" || c === "1") return t("channels.inApp");
  if (c === "email" || c === "2") return t("channels.email");
  if (c === "sms" || c === "3") return t("channels.sms");
  if (c === "push" || c === "4") return t("channels.push");
  return t("channels.unknown");
}

function NotificationRow({
  n,
  locale,
  onActivate,
}: {
  n: NotificationItem;
  locale: string;
  onActivate: (id: string) => void;
}) {
  const t = useTranslations("notifications");
  const rel = formatRelativeTimeShort(
    new Date(n.sentAt),
    new Date(),
    locale === "am" ? "am" : "en",
  );

  return (
    <button
      type="button"
      onClick={() => {
        if (!n.isRead) onActivate(n.id);
      }}
      className={cn(
        "hover:bg-muted/50 flex w-full items-start gap-3 border-b border-border px-4 py-4 text-left transition-colors last:border-b-0 md:px-6",
        !n.isRead && "bg-primary/[0.03]",
      )}
    >
      <span className="mt-1.5 flex w-2 shrink-0 justify-center" aria-hidden>
        {!n.isRead ? (
          <span className="bg-primary size-2 rounded-full" />
        ) : (
          <span className="size-2" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-foreground block font-semibold">
          {n.title ?? t("row.untitled")}
        </span>
        <span className="text-muted-foreground mt-0.5 line-clamp-2 block text-sm leading-relaxed">
          {n.body ?? ""}
        </span>
        <span className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-xs sm:hidden">
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
              channelTagClass(n.channel),
            )}
          >
            {formatChannelLabel(n.channel, t)}
          </span>
          <span>{rel}</span>
        </span>
      </span>
      <span className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
            channelTagClass(n.channel),
          )}
        >
          {formatChannelLabel(n.channel, t)}
        </span>
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {rel}
        </span>
      </span>
    </button>
  );
}

export function NotificationsFeedScreen() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [channel, setChannel] = useState<ChannelFilter>("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const isFilteredTab = statusTab !== "all";
  const queryPage = isFilteredTab ? 1 : page;
  const queryPageSize = isFilteredTab ? 100 : pageSize;

  const channelParam = channel || undefined;

  const listQuery = useNotificationsPaged({
    channel: channelParam,
    page: queryPage,
    pageSize: queryPageSize,
  });

  const { data: unreadCount = 0 } = useNotificationUnreadCount(true);

  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const rows = useMemo(() => {
    const raw = listQuery.data?.items ?? [];
    if (statusTab === "unread") return raw.filter((n) => !n.isRead);
    if (statusTab === "read") return raw.filter((n) => n.isRead);
    return raw;
  }, [listQuery.data?.items, statusTab]);

  const grouped = useMemo(() => groupNotificationsByCalendarDay(rows), [rows]);

  const totalPages =
    isFilteredTab || !listQuery.data
      ? 1
      : Math.max(1, listQuery.data.totalPages ?? 1);

  const pageLabel = t("feed.pageIndicator", {
    page: isFilteredTab ? 1 : page,
    totalPages,
  });

  function handleMarkAll() {
    markAll.mutate();
  }

  function handleRowActivate(id: string) {
    markOne.mutate(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-foreground text-xl font-bold tracking-tight md:text-2xl">
            {t("feed.title")}
          </h2>
          {unreadCount > 0 ? (
            <Badge variant="default" className="font-semibold">
              {t("feed.unreadBadge", { count: unreadCount })}
            </Badge>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start sm:self-auto"
          disabled={unreadCount === 0 || markAll.isPending}
          onClick={handleMarkAll}
        >
          {t("feed.markAllRead")}
        </Button>
      </div>

      <div
        className={cn(
          panelSurface,
          "flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5",
        )}
      >
        <div className="bg-muted/60 inline-flex rounded-lg p-0.5">
          {(["all", "unread", "read"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setStatusTab(key);
                setPage(1);
              }}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                statusTab === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`feed.tabs.${key}`)}
            </button>
          ))}
        </div>

        <div className="relative min-w-[180px] md:max-w-xs">
          <select
            value={channel}
            onChange={(e) => {
              setChannel(e.target.value as ChannelFilter);
              setPage(1);
            }}
            className="border-border bg-background focus-visible:ring-ring h-10 w-full appearance-none rounded-lg border pr-9 pl-3 text-sm shadow-sm outline-none focus-visible:ring-2"
            aria-label={t("feed.channelFilterAria")}
          >
            <option value="">{t("feed.channelsAll")}</option>
            <option value="InApp">{t("channels.inApp")}</option>
            <option value="Email">{t("channels.email")}</option>
            <option value="Sms">{t("channels.sms")}</option>
            <option value="Push">{t("channels.push")}</option>
          </select>
          <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2" />
        </div>
      </div>

      {listQuery.isError ? (
        <p className="text-destructive text-sm" role="alert">
          {getApiErrorMessage(listQuery.error)}
        </p>
      ) : null}

      <div className={panelSurface}>
        {listQuery.isLoading ? (
          <p className="text-muted-foreground px-6 py-10 text-sm">
            {t("feed.loading")}
          </p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground px-6 py-10 text-sm">
            {t("feed.empty")}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {grouped.map((group) => (
              <div key={group.key}>
                <div className="text-muted-foreground bg-muted/30 px-4 py-2 text-[11px] font-semibold tracking-wider uppercase md:px-6">
                  {t(`feed.dayGroups.${group.key}`)}
                </div>
                <div>
                  {group.items.map((n) => (
                    <NotificationRow
                      key={n.id}
                      n={n}
                      locale={locale}
                      onActivate={handleRowActivate}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isFilteredTab && totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={t("feed.previousPage")}
            disabled={page <= 1 || listQuery.isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-muted-foreground text-sm">{pageLabel}</span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={t("feed.nextPage")}
            disabled={page >= totalPages || listQuery.isLoading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      ) : null}

      {isFilteredTab ? (
        <p className="text-muted-foreground text-center text-xs">
          {t("feed.filteredHint")}
        </p>
      ) : null}
    </div>
  );
}
