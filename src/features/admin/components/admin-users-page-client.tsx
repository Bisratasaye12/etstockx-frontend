"use client";

import { useTranslations } from "next-intl";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminUsersManagementScreen } from "@/features/admin/components/admin-users-management-screen";

export function AdminUsersPageClient() {
  const t = useTranslations("admin.shell");

  return (
    <AdminPageShell
      title={t("manageAdminsPageTitle")}
      subtitle={t("manageAdminsPageSubtitle")}
    >
      <AdminUsersManagementScreen />
    </AdminPageShell>
  );
}
