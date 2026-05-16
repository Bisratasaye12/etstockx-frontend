"use client";

import { usePathname } from "@/shared/i18n/routing";
import { AdminNavigatingSkeleton } from "@/features/admin/components/admin-skeletons";

export function AdminRouteLoadingClient() {
  const pathname = usePathname();
  return <AdminNavigatingSkeleton href={pathname} />;
}
