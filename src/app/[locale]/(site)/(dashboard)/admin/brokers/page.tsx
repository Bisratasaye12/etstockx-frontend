"use client";

import { useTranslations } from "next-intl";
import { PendingBrokersPanel } from "@/features/admin/components/pending-brokers-panel";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";

export default function AdminBrokersPage() {
  const t = useTranslations("admin.shell");

  return (
    <AdminPageShell
      title={t("brokerPageTitle")}
      subtitle={t("brokerPageSubtitle")}
    >
      <PendingBrokersPanel />
    </AdminPageShell>
  );
}
