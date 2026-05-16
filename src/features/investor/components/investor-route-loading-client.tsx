"use client";

import { usePathname } from "@/shared/i18n/routing";
import { InvestorNavigatingSkeleton } from "@/features/investor/components/investor-skeletons";

export function InvestorRouteLoadingClient() {
  const pathname = usePathname();
  return <InvestorNavigatingSkeleton href={pathname} />;
}
