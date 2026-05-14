"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowRightLeft,
  Bell,
  CheckCircle2,
  ChevronRight,
  FileText,
  Mail,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import type { NotificationItem } from "@/entities/notification/model/types";
import type { UserRole } from "@/shared/api/types";
import { formatRelativeTimeShort } from "@/shared/lib/format-relative-time";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { useNotificationUnreadCount } from "@/features/notifications/api/use-notification-unread-count";
import { useNotificationsUnreadList } from "@/features/notifications/api/use-notifications-unread-list";
import { useMarkAllNotificationsRead } from "@/features/notifications/api/use-mark-all-notifications-read";
import { useMarkNotificationRead } from "@/features/notifications/api/use-mark-notification-read";
import { getNotificationTargetHref } from "@/features/notifications/lib/get-notification-target-href";

function pickEventIcon(eventType: string | null) {
  const e = (eventType ?? "").toLowerCase();
  if (e.includes("message") || e.includes("chat")) {
    return (
      <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
        <Mail className="size-4" aria-hidden />
      </span>
    );
  }
  if (
    e.includes("listing") ||
    e.includes("approve") ||
    e.includes("published")
  ) {
    return (
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
        <CheckCircle2 className="size-4" aria-hidden />
      </span>
    );
  }
  if (e.includes("order") || e.includes("status") || e.includes("trade")) {
    return (
      <span className="bg-sky-500/15 text-sky-700 flex size-9 shrink-0 items-center justify-center rounded-full">
        <ArrowRightLeft className="size-4" aria-hidden />
      </span>
    );
  }
  return (
    <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
      <FileText className="size-4" aria-hidden />
    </span>
  );
}

function rowShellClassName() {
  return cn(
    "hover:bg-muted/60 flex w-full gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0",
  );
}

function DropdownRow({
  n,
  locale,
  targetHref,
  onActivate,
}: {
  n: NotificationItem;
  locale: string;
  targetHref: string | null;
  onActivate: (id: string) => void;
}) {
  const t = useTranslations("notifications");
  const rel = formatRelativeTimeShort(
    new Date(n.sentAt),
    new Date(),
    locale === "am" ? "am" : "en",
  );

  function handleActivate() {
    onActivate(n.id);
  }

  const inner = (
    <>
      {pickEventIcon(n.eventType)}
      <span className="min-w-0 flex-1">
        <span className="text-foreground flex flex-wrap items-baseline gap-x-2 gap-y-0.5 font-semibold">
          <span>{n.title ?? t("row.untitled")}</span>
          <span className="text-muted-foreground text-xs font-normal whitespace-nowrap">
            ({rel})
          </span>
        </span>
        <span className="text-muted-foreground mt-0.5 line-clamp-2 text-sm leading-snug">
          {n.body ?? ""}
        </span>
      </span>
      {!n.isRead ? (
        <span className="mt-1 flex shrink-0 self-start" aria-hidden>
          <span className="bg-primary size-2 rounded-full" />
        </span>
      ) : (
        <span className="size-2 shrink-0" aria-hidden />
      )}
    </>
  );

  if (targetHref) {
    return (
      <Link
        href={targetHref}
        className={rowShellClassName()}
        onClick={handleActivate}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={rowShellClassName()}
      onClick={handleActivate}
    >
      {inner}
    </button>
  );
}

type NotificationBellDropdownProps = {
  viewAllHref: string;
  enabled?: boolean;
};

export function NotificationBellDropdown({
  viewAllHref,
  enabled = true,
}: NotificationBellDropdownProps) {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const { data: session } = useSession();
  const role = session?.user?.role as UserRole | undefined;
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { data: unreadCount = 0 } = useNotificationUnreadCount(enabled);
  const list = useNotificationsUnreadList(12, enabled && open);
  const markAll = useMarkAllNotificationsRead();
  const markOne = useMarkNotificationRead();

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = list.data ?? [];
  const showEmpty = open && !list.isLoading && items.length === 0;

  function handleRowActivate(id: string) {
    const row = items.find((i) => i.id === id);
    if (row && !row.isRead) markOne.mutate(id);
    setOpen(false);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground relative rounded-full p-2.5"
        aria-label={t("dropdown.triggerAria")}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="size-5" />
        {unreadCount > 0 ? (
          <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ring-2 ring-background">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="border-border bg-card absolute top-full right-0 z-50 mt-2 w-[min(calc(100vw-1.5rem),22rem)] overflow-hidden rounded-xl border shadow-lg"
          role="dialog"
          aria-label={t("dropdown.dialogAria")}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-foreground truncate font-semibold">
                {t("dropdown.title")}
              </span>
              {unreadCount > 0 ? (
                <Badge variant="default" className="shrink-0 text-[10px]">
                  {unreadCount}
                </Badge>
              ) : null}
            </div>
            <button
              type="button"
              className={cn(
                "text-primary shrink-0 text-xs font-medium hover:underline disabled:opacity-40",
              )}
              disabled={unreadCount === 0 || markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              {t("dropdown.markAllRead")}
            </button>
          </div>

          <div className="max-h-[min(24rem,70vh)] overflow-y-auto">
            {list.isLoading ? (
              <p className="text-muted-foreground px-4 py-8 text-center text-sm">
                {t("dropdown.loading")}
              </p>
            ) : showEmpty ? (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <span className="bg-muted text-muted-foreground mb-3 flex size-14 items-center justify-center rounded-full">
                  <Bell className="size-7" aria-hidden />
                </span>
                <p className="text-foreground font-semibold">
                  {t("dropdown.emptyTitle")}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("dropdown.emptySubtitle")}
                </p>
              </div>
            ) : (
              items.map((n) => (
                <DropdownRow
                  key={n.id}
                  n={n}
                  locale={locale}
                  targetHref={getNotificationTargetHref(n, role)}
                  onActivate={handleRowActivate}
                />
              ))
            )}
          </div>

          <div className="border-border border-t px-4 py-3">
            <Link
              href={viewAllHref}
              className="text-primary flex items-center justify-center gap-1 text-sm font-medium hover:underline"
              onClick={() => setOpen(false)}
            >
              {t("dropdown.viewAll")}
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
