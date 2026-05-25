import { SecurityDetailView } from "@/features/market/components/security-detail-view";

type Props = { params: Promise<{ securityId: string }> };

export default async function SecurityDetailPage({ params }: Props) {
  const { securityId } = await params;
  return <SecurityDetailView securityId={securityId} />;
}
