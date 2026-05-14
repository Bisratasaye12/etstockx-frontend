"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";

function initialsFromEmail(email: string) {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[.\s_-]+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "U"
  );
}

export type DashboardHeaderProfileMenuProps = {
  profileHref: string;
};

export function DashboardHeaderProfileMenu({
  profileHref,
}: DashboardHeaderProfileMenuProps) {
  const { data: session, status } = useSession();
  const tNav = useTranslations("nav");
  const th = useTranslations("headerProfile");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const email = session?.user?.email ?? "";
  const role = session?.user?.role ?? "";
  const initials = useMemo(() => initialsFromEmail(email), [email]);

  const roleLabel = useMemo(() => {
    switch (role) {
      case "Client":
        return th("roleClient");
      case "Broker":
        return th("roleBroker");
      case "Dealer":
        return th("roleDealer");
      case "Admin":
        return th("roleAdmin");
      default:
        return role || th("roleUnknown");
    }
  }, [role, th]);

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
        aria-haspopup="dialog"
        aria-label={th("menuAria")}
        className="border-border hover:bg-muted/70 flex items-center gap-2 rounded-full border bg-background py-1 pr-2 pl-1 shadow-sm transition-colors md:gap-2.5 md:pr-3"
      >
        <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-inner">
          {status === "loading" ? (
            <span className="opacity-70">…</span>
          ) : (
            initials
          )}
        </span>
        <span className="text-foreground hidden text-sm font-semibold md:inline">
          {tNav("profile")}
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
        <div className="border-border bg-card absolute top-[calc(100%+10px)] right-0 z-50 w-[min(100vw-2rem,280px)] overflow-hidden rounded-xl border py-1 shadow-lg">
          <Link
            href={profileHref}
            className="hover:bg-muted/80 block px-4 py-3 transition-colors"
            onClick={() => setOpen(false)}
          >
            <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              {th("signedInAs")}
            </p>
            <p className="text-foreground mt-0.5 truncate text-sm font-semibold">
              {email || "—"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">{roleLabel}</p>
            <p className="text-primary mt-2 text-xs font-semibold">
              {th("viewProfile")} →
            </p>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
