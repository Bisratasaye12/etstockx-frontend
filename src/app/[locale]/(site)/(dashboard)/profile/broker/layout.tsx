import { BrokerPortalShell } from "@/features/broker/components/layout/broker-portal-shell";
import { BrokerProfileChrome } from "@/features/broker/components/profile/broker-profile-chrome";

export default function BrokerProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BrokerPortalShell>
      <BrokerProfileChrome>{children}</BrokerProfileChrome>
    </BrokerPortalShell>
  );
}
