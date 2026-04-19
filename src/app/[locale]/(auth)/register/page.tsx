import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { LineChart, Search, ShieldCheck } from "lucide-react";
import { RegisterForm } from "@/features/auth/components/register-form";

export default async function RegisterPage() {
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");
  const year = new Date().getFullYear();

  const valueProps = [
    {
      Icon: ShieldCheck,
      title: t("registerValue1Title"),
      body: t("registerValue1Body"),
    },
    {
      Icon: LineChart,
      title: t("registerValue2Title"),
      body: t("registerValue2Body"),
    },
    {
      Icon: Search,
      title: t("registerValue3Title"),
      body: t("registerValue3Body"),
    },
  ] as const;

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[minmax(280px,38%)_1fr]">
      <aside className="bg-primary text-primary-foreground flex flex-col justify-between gap-10 px-8 py-10 max-lg:px-6 max-lg:py-8">
        <div className="flex flex-col gap-10">
          <Image
            src="/EtStockX.svg"
            alt={tCommon("appName")}
            width={200}
            height={44}
            className="h-9 w-auto max-w-[200px] shrink-0 brightness-0 invert"
          />
          <div>
            <h1 className="font-heading text-3xl leading-tight font-bold tracking-tight md:text-4xl">
              {t("registerHeroTitle")}
            </h1>
          </div>
          <ul className="flex flex-col gap-8">
            {valueProps.map(({ Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="bg-primary-foreground/15 flex size-11 shrink-0 items-center justify-center rounded-xl">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="space-y-1.5">
                  <p className="font-heading text-base font-semibold leading-snug">
                    {title}
                  </p>
                  <p className="text-primary-foreground/85 text-sm leading-relaxed">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-primary-foreground/70 text-xs leading-relaxed">
          {t("registerHeroFooter", { year })}
        </p>
      </aside>
      <div className="bg-background flex flex-col">
        <RegisterForm />
      </div>
    </div>
  );
}
