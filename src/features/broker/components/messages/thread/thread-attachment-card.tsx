"use client";

import { Download } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { AttachmentDto } from "@/entities/messaging/model/types";
import { getAttachmentDownloadUrl } from "@/features/messaging/api/get-attachment-url";
import { resolveAttachmentVisual } from "@/features/messaging/lib/attachment-visual";
import { formatFileSize } from "@/features/messaging/lib/format-file-size";
import { usePortalThreadMessagesTranslations } from "@/features/messaging/context/messaging-portal-context";

type Props = {
  attachment: AttachmentDto;
  ownership: "own" | "incoming";
};

export function ThreadAttachmentCard({ attachment, ownership }: Props) {
  const t = usePortalThreadMessagesTranslations();
  const { Icon, iconBoxClass } = resolveAttachmentVisual(
    attachment.fileType,
    attachment.fileName,
  );

  const sizeLabel = formatFileSize(attachment.sizeBytes);
  const fileName = attachment.fileName?.trim() || t("untitledAttachment");

  return (
    <a
      href={getAttachmentDownloadUrl(attachment.id)}
      target="_blank"
      rel="noopener noreferrer"
      download={attachment.fileName ?? undefined}
      aria-label={t("downloadAttachment", { name: fileName })}
      className={cn(
        "group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
        ownership === "own"
          ? "border-primary/20 bg-primary/[0.07] hover:bg-primary/10"
          : "border-border bg-card hover:bg-muted/50",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-md",
          iconBoxClass,
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-foreground truncate font-medium">{fileName}</span>
        {sizeLabel ? (
          <span className="text-muted-foreground text-xs">{sizeLabel}</span>
        ) : null}
      </span>
      <Download
        className="text-muted-foreground size-4 shrink-0 transition-colors group-hover:text-foreground"
        aria-hidden
      />
    </a>
  );
}
