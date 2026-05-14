"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { resolveAttachmentVisual } from "@/features/messaging/lib/attachment-visual";
import { formatFileSize } from "@/features/messaging/lib/format-file-size";
import { usePortalThreadMessagesTranslations } from "@/features/messaging/context/messaging-portal-context";

type Props = {
  file: File;
  onRemove: () => void;
};

export function ComposerAttachmentPreview({ file, onRemove }: Props) {
  const t = usePortalThreadMessagesTranslations();
  const { Icon, iconBoxClass, kind } = resolveAttachmentVisual(
    file.type,
    file.name,
  );
  const isImage = kind === "image";

  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  return (
    <div className="border-border bg-card flex items-end gap-3 border-b px-4 py-3 md:px-5">
      <div className="border-border bg-muted/30 relative flex w-[180px] flex-col gap-1.5 rounded-lg border p-2">
        {isImage && objectUrl ? (
          <div className="bg-muted/50 h-24 w-full overflow-hidden rounded-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={objectUrl}
              alt={file.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div
            className={cn(
              "flex h-24 w-full items-center justify-center rounded-md",
              iconBoxClass,
            )}
            aria-hidden
          >
            <Icon className="size-8" />
          </div>
        )}
        <span className="text-foreground truncate text-xs font-medium">
          {file.name}
        </span>
        <span className="text-muted-foreground text-[10px]">
          {formatFileSize(file.size)}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("removeAttachment", { name: file.name })}
          className="bg-foreground/80 hover:bg-foreground absolute -top-2 -right-2 inline-flex size-5 cursor-pointer items-center justify-center rounded-full text-white shadow-sm transition-colors"
        >
          <X className="size-3" aria-hidden />
        </button>
      </div>
    </div>
  );
}
