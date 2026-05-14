"use client";

import type { MessageDayGroup } from "@/features/messaging/lib/group-messages-by-day";
import { usePortalThreadMessagesTranslations } from "@/features/messaging/context/messaging-portal-context";

type Props = {
  group: Pick<MessageDayGroup, "kind" | "iso">;
  locale: string;
};

export function ThreadDaySeparator({ group, locale }: Props) {
  const t = usePortalThreadMessagesTranslations();

  let label: string;
  if (group.kind === "today") {
    label = t("today");
  } else if (group.kind === "yesterday") {
    label = t("yesterday");
  } else {
    const date = new Date(group.iso);
    const intlLocale = locale === "am" ? "am-ET" : "en-US";
    const sameYear = date.getFullYear() === new Date().getFullYear();
    label = new Intl.DateTimeFormat(intlLocale, {
      month: "short",
      day: "numeric",
      ...(sameYear ? {} : { year: "numeric" }),
    }).format(date);
  }

  return (
    <div className="my-2 flex items-center justify-center" role="presentation">
      <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-[11px] font-medium">
        {label}
      </span>
    </div>
  );
}
