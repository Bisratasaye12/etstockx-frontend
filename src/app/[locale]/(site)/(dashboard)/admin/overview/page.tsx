"use client";

import { useTranslations } from "next-intl";
import { AdminOverviewDashboard } from "@/features/admin/components/admin-overview-dashboard";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";

export default function AdminOverviewPage() {
  const t = useTranslations("admin.shell");

  return (
    <AdminPageShell
      title={t("overviewPageTitle")}
      subtitle={t("overviewPageSubtitle")}
    >
      <AdminOverviewDashboard />
    </AdminPageShell>
  );
}
