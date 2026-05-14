import { getTranslations } from "next-intl/server";
import { AdminWiringStatusCard } from "@/features/admin/components/admin-wiring-status-card";
import { AdminPlaceholderPanel } from "@/features/admin/components/admin-placeholder-panel";

export default async function AdminOverviewPage() {
  const t = await getTranslations("admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("shell.overviewPageTitle")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("shell.overviewPageSubtitle")}
        </p>
      </div>
      <AdminWiringStatusCard />
      <AdminPlaceholderPanel
        title={t("shell.placeholderTitle")}
        description={t("shell.placeholderDescription")}
      />
    </div>
  );
}
