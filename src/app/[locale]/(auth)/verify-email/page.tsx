import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { VerifyEmailContent } from "@/features/auth/components/verify-email-content";

export default async function VerifyEmailPage() {
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("verifyTitle")}
      </h1>
      <Suspense fallback={<p className="text-muted-foreground text-sm">…</p>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
