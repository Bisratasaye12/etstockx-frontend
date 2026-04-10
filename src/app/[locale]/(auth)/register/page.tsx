import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/features/auth/components/register-form";

export default async function RegisterPage() {
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("registerTitle")}
      </h1>
      <RegisterForm />
    </div>
  );
}
