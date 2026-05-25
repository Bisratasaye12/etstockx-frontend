"use client";

import { useTranslations } from "next-intl";
import { AdminSecuritiesPanel } from "@/features/admin/components/admin-securities-panel";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";

export default function AdminSecuritiesPage() {
  const t = useTranslations("admin.shell");

  return (
    <AdminPageShell
      title={t("securitiesPageTitle")}
      subtitle={t("securitiesPageSubtitle")}
    >
      <AdminSecuritiesPanel />
    </AdminPageShell>
  );
}
