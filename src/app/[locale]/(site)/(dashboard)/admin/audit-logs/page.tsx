"use client";

import { useTranslations } from "next-intl";
import { AuditLogsPanel } from "@/features/admin/components/audit-logs-panel";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";

export default function AdminAuditLogsPage() {
  const t = useTranslations("admin.shell");

  return (
    <AdminPageShell
      title={t("auditPageTitle")}
      subtitle={t("auditPageSubtitle")}
    >
      <AuditLogsPanel />
    </AdminPageShell>
  );
}
