"use client";

import { useTranslations } from "next-intl";
import { ListingModerationPanel } from "@/features/admin/components/listing-moderation-panel";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";

export default function AdminListingsPage() {
  const t = useTranslations("admin.shell");

  return (
    <AdminPageShell
      title={t("listingsPageTitle")}
      subtitle={t("listingsPageSubtitle")}
    >
      <ListingModerationPanel />
    </AdminPageShell>
  );
}
