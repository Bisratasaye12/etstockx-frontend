import { getTranslations } from "next-intl/server";
import { AuditLogsPanel } from "@/features/admin/components/audit-logs-panel";

export default async function AdminAuditLogsPage() {
  const t = await getTranslations("admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("shell.auditPageTitle")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("shell.auditPageSubtitle")}
        </p>
      </div>
      <AuditLogsPanel />
    </div>
  );
}
