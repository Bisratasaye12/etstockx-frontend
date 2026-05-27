import { getTranslations } from "next-intl/server";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { BrokerApplicationDetailPage } from "@/features/admin/components/broker-application-detail-page";

type PageProps = {
  params: Promise<{ applicationId: string }>;
};

export default async function AdminBrokerApplicationDetailRoute({
  params,
}: PageProps) {
  const t = await getTranslations("admin");
  const { applicationId } = await params;

  return (
    <AdminPageShell
      title={t("brokers.detailTitle")}
      subtitle={t("brokers.detailSubtitle")}
    >
      <BrokerApplicationDetailPage applicationId={applicationId} />
    </AdminPageShell>
  );
}
