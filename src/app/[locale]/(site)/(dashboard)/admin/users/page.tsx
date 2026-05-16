import { AdminUsersPageClient } from "@/features/admin/components/admin-users-page-client";
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

  return <AdminUsersPageClient />;
}
