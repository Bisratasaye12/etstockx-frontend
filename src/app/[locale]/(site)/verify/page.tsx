import { VerifyAgreementClient } from "@/features/documents/components/verify-agreement-client";

export const dynamic = "force-dynamic";

interface VerifyPageProps {
  searchParams?: Promise<{
    doc?: string;
    hash?: string;
  }>;
}

export default async function VerifyTradeAgreementPage({
  searchParams,
}: VerifyPageProps) {
  const params = (await searchParams) ?? {};
  return (
    <VerifyAgreementClient
      initialDocumentNumber={params.doc ?? ""}
      initialHash={params.hash ?? ""}
    />
  );
}
