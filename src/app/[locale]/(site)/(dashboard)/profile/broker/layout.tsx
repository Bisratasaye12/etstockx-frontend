import { BrokerProfileChrome } from "@/features/broker/components/profile/broker-profile-chrome";

export default function BrokerProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BrokerProfileChrome>{children}</BrokerProfileChrome>;
}
