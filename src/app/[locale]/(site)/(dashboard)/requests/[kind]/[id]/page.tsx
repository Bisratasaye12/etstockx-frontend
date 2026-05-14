import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { redirect } from "@/shared/i18n/routing";
import { InvestorRequestDetailView } from "@/features/investor/components/investor-request-detail-view";

export default async function InvestorRequestDetailPage({
  params,
}: {
  params: Promise<{ locale: string; kind: string; id: string }>;
}) {
  const { locale, kind, id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "Client") {
    redirect({ href: "/dashboard", locale });
  }
  if (kind !== "buy" && kind !== "sell") {
    notFound();
  }

  return <InvestorRequestDetailView kind={kind} id={id} />;
}
