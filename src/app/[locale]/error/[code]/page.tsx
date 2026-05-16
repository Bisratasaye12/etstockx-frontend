import { notFound } from "next/navigation";
import { ErrorScreen } from "@/features/errors/components/error-screen";
import { isErrorCode, type ErrorCode } from "@/features/errors/lib/error-codes";

type PageProps = {
  params: Promise<{ code: string }>;
};

export default async function ErrorCodePage({ params }: PageProps) {
  const { code } = await params;

  if (!isErrorCode(code)) {
    notFound();
  }

  return <ErrorScreen code={code as ErrorCode} />;
}
