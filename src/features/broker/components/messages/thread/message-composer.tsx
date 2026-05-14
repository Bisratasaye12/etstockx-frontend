"use client";

import { useId, useRef, useState } from "react";
import { Paperclip, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { ComposerAttachmentPreview } from "@/features/broker/components/messages/thread/composer-attachment-preview";

/**
 * Mirrors the backend's accepted MIME list (PDF, DOCX, XLSX, JPEG, PNG) and
 * 10 MB size cap. We hint these to the OS file picker and validate locally so
 * the failure path doesn't require a round-trip.
 */
const ACCEPTED_MIME =
  ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png";
const MAX_BYTES = 10 * 1024 * 1024;

type Props = {
  onSendText: (content: string) => Promise<void> | void;
  onSendAttachment: (file: File, caption: string) => Promise<void> | void;
  isSending: boolean;
};

export function MessageComposer({
  onSendText,
  onSendAttachment,
  isSending,
}: Props) {
  const t = useTranslations("broker.messages.thread");
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const trimmed = text.trim();
  const canSubmit = !isSending && (trimmed.length > 0 || pendingFile !== null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLocalError(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setLocalError(t("attachmentTooLarge"));
      return;
    }
    setPendingFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      if (pendingFile) {
        await onSendAttachment(pendingFile, trimmed);
      } else {
        await onSendText(trimmed);
      }
      setText("");
      setPendingFile(null);
    } catch {
      // Parent surfaces the API error; nothing extra to do here.
    }
  }

  return (
    <div className="border-border bg-card border-t">
      {pendingFile ? (
        <ComposerAttachmentPreview
          file={pendingFile}
          onRemove={() => setPendingFile(null)}
        />
      ) : null}

      {localError ? (
        <p
          className="text-destructive border-border border-b px-4 py-2 text-xs md:px-5"
          role="alert"
        >
          {localError}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-3 py-3 md:px-4"
      >
        <input
          ref={fileInputRef}
          id={fileInputId}
          type="file"
          className="sr-only"
          accept={ACCEPTED_MIME}
          onChange={handleFileChange}
          disabled={isSending}
        />
        <label
          htmlFor={fileInputId}
          aria-label={t("attachFile")}
          title={t("attachFile")}
          className={cn(
            "text-muted-foreground hover:bg-muted/60 hover:text-foreground inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors",
            isSending && "pointer-events-none opacity-50",
          )}
        >
          <Paperclip className="size-5" aria-hidden />
        </label>

        <div className="bg-muted/40 flex min-w-0 flex-1 items-center rounded-full px-4 py-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              pendingFile
                ? t("composerCaptionPlaceholder")
                : t("composerPlaceholder")
            }
            aria-label={t("composerPlaceholder")}
            disabled={isSending}
            className="placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <Button
          type="submit"
          size="icon"
          aria-label={t("send")}
          disabled={!canSubmit}
          className="rounded-full"
        >
          <Send className="size-4" aria-hidden />
        </Button>
      </form>
    </div>
  );
}
