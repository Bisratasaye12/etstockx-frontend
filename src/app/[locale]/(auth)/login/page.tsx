import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage() {
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("loginTitle")}
      </h1>
      <Suspense fallback={<p className="text-muted-foreground text-sm">…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
