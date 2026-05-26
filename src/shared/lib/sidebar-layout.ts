import { cn } from "@/shared/lib/utils";

export const PORTAL_SIDEBAR_TRANSITION =
  "transition-[width] duration-200 ease-in-out";

export function portalSidebarAsideClass(collapsed: boolean, extra?: string) {
  return cn(
    "border-border bg-card flex min-h-screen shrink-0 flex-col self-stretch overflow-hidden border-r",
    PORTAL_SIDEBAR_TRANSITION,
    collapsed ? "w-[4.5rem]" : "w-64",
    extra,
  );
}

export function portalSidebarNavRowClass(collapsed: boolean, active?: boolean) {
  return cn(
    "text-muted-foreground hover:text-foreground hover:bg-muted/80 flex w-full items-center rounded-xl text-[15px] transition-colors",
    collapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3",
    active && "bg-primary/15 text-primary font-semibold",
  );
}

/** Label inside sidebar footer actions (e.g. sign out) — left-aligns on `<button>`. */
export function portalSidebarFooterActionLabelClass(collapsed: boolean) {
  return cn(portalSidebarNavLabelClass(collapsed), !collapsed && "text-left");
}

export function portalSidebarNavLabelClass(collapsed: boolean) {
  return cn(
    "truncate transition-opacity duration-200",
    collapsed ? "sr-only" : "flex-1",
  );
}
