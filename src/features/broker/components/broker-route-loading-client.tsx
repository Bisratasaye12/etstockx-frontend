"use client";

import { usePathname } from "@/shared/i18n/routing";
import { BrokerNavigatingSkeleton } from "@/features/broker/components/broker-skeletons";

export function BrokerRouteLoadingClient() {
  const pathname = usePathname();
  return <BrokerNavigatingSkeleton href={pathname} />;
}
