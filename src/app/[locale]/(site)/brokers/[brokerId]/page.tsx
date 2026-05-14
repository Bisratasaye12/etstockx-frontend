import { BrokerProfileView } from "@/features/brokers/components/broker-profile-view";

export default async function BrokerProfilePage({
  params,
}: {
  params: Promise<{ brokerId: string }>;
}) {
  const { brokerId } = await params;
  return <BrokerProfileView brokerId={brokerId} />;
}
