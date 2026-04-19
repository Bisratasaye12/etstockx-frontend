import { getTranslations } from "next-intl/server";
import { PendingBrokersPanel } from "@/features/admin/components/pending-brokers-panel";

export default async function AdminBrokersPage() {
  const t = await getTranslations("admin");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <PendingBrokersPanel />
    </div>
  );
}
