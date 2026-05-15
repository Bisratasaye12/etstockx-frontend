import { getTranslations } from "next-intl/server";
import { AdminUsersManagementScreen } from "@/features/admin/components/admin-users-management-screen";
import { safeAuth } from "@/shared/lib/safe-auth";
import { redirect } from "@/shared/i18n/routing";
import { isSuperAdminRole } from "@/shared/lib/user-role";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await safeAuth();

  if (!isSuperAdminRole(session?.user?.rawRole ?? session?.user?.role)) {
    redirect({ href: "/admin/overview", locale });
  }

  const t = await getTranslations("admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("shell.manageAdminsPageTitle")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("shell.manageAdminsPageSubtitle")}
        </p>
      </div>
      <AdminUsersManagementScreen />
    </div>
  );
}
