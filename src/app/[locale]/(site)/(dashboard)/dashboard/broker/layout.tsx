import { BrokerPortalShell } from "@/features/broker/components/layout/broker-portal-shell";

export default function BrokerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BrokerPortalShell>{children}</BrokerPortalShell>;
}
