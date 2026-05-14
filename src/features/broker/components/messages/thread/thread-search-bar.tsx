"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/shared/ui/input";

type Props = {
  value: string;
  onChange: (next: string) => void;
  onClose: () => void;
};

export function ThreadSearchBar({ value, onChange, onClose }: Props) {
  const t = useTranslations("broker.messages.thread");

  return (
    <div className="border-border bg-card border-b px-4 py-2.5 md:px-5">
      <div className="relative">
        <Search
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
        />
        <Input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          autoFocus
          className="border-border bg-background h-10 rounded-lg pr-9 pl-10"
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
        />
        <button
          type="button"
          onClick={onClose}
          aria-label={t("closeSearch")}
          className="text-muted-foreground hover:bg-muted/60 hover:text-foreground absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full transition-colors"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
