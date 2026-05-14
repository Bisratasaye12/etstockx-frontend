import { getTranslations } from "next-intl/server";
import { PendingBrokersPanel } from "@/features/admin/components/pending-brokers-panel";

export default async function AdminBrokersPage() {
  const t = await getTranslations("admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("shell.brokerPageTitle")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("shell.brokerPageSubtitle")}
        </p>
      </div>
      <PendingBrokersPanel />
    </div>
  );
}
