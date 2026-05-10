"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Settings, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";

export function InvestorHeaderProfileMenu() {
  const t = useTranslations("nav");
  const tShell = useTranslations("investor.shell");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="border-border hover:bg-muted/70 flex items-center gap-2 rounded-full border bg-background py-1 pr-2 pl-1 shadow-sm transition-colors md:gap-2.5 md:pr-3"
      >
        <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-full shadow-inner">
          <UserRound className="size-[18px]" aria-hidden />
        </span>
        <span className="text-foreground hidden text-sm font-semibold md:inline">
          {t("profile")}
        </span>
        <ChevronDown
          className={cn(
            "text-muted-foreground mr-0.5 size-4 shrink-0 transition-transform duration-200 md:size-[18px]",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="border-border bg-card absolute top-[calc(100%+10px)] right-0 z-50 min-w-[200px] rounded-xl border py-1.5 shadow-lg"
        >
          <Link
            role="menuitem"
            href="/profile/client"
            className="hover:bg-muted/80 flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium"
            onClick={() => setOpen(false)}
          >
            <UserRound className="text-muted-foreground size-4" aria-hidden />
            {tShell("menuMyProfile")}
          </Link>
          <Link
            role="menuitem"
            href="/profile/client"
            className="hover:bg-muted/80 flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium"
            onClick={() => setOpen(false)}
          >
            <Settings className="text-muted-foreground size-4" aria-hidden />
            {tShell("menuSettings")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
