"use client";

import { PanelLeft, PanelLeftClose } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSidebarCollapsed } from "@/shared/hooks/use-sidebar-collapsed";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

type SidebarCollapseToggleProps = {
  className?: string;
};

export function SidebarCollapseToggle({
  className,
}: SidebarCollapseToggleProps) {
  const { collapsed, toggle } = useSidebarCollapsed();
  const t = useTranslations("common");

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "text-muted-foreground size-10 shrink-0 rounded-full",
        className,
      )}
      onClick={toggle}
      aria-expanded={!collapsed}
      aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
    >
      {collapsed ? (
        <PanelLeft className="size-5" aria-hidden />
      ) : (
        <PanelLeftClose className="size-5" aria-hidden />
      )}
    </Button>
  );
}
