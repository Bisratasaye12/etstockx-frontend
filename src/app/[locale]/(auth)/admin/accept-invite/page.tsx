import Image from "next/image";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { KeyRound, MailCheck, ShieldCheck } from "lucide-react";
import { AdminAcceptInvitePanel } from "@/features/auth/components/admin-accept-invite-panel";

export default async function AdminAcceptInvitePage() {
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");

  const valueProps = [
    {
      Icon: ShieldCheck,
      title: t("acceptInviteAsideValue1Title"),
      body: t("acceptInviteAsideValue1Body"),
    },
    {
      Icon: KeyRound,
      title: t("acceptInviteAsideValue2Title"),
      body: t("acceptInviteAsideValue2Body"),
    },
    {
      Icon: MailCheck,
      title: t("acceptInviteAsideValue3Title"),
      body: t("acceptInviteAsideValue3Body"),
    },
  ] as const;

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[minmax(280px,38%)_1fr]">
      <aside className="bg-primary text-primary-foreground flex flex-col gap-10 px-8 py-10 max-lg:px-6 max-lg:py-8">
        <div className="flex flex-col gap-10">
          <div className="relative h-12 w-full min-w-0 sm:h-14">
            <Image
              src="/EtStockX.svg"
              alt={tCommon("appName")}
              fill
              className="object-contain object-left brightness-0 invert"
              sizes="(max-width: 1024px) 100vw, min(38vw, 420px)"
              unoptimized
              priority
            />
          </div>
          <div>
            <h1 className="font-heading text-primary-foreground text-3xl leading-tight font-bold tracking-tight md:text-4xl">
              {t("acceptInviteHeroTitle")}
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
      </aside>
      <div className="bg-muted/35 flex flex-col justify-center">
        <Suspense
          fallback={
            <div className="text-muted-foreground flex flex-1 items-center justify-center p-8 text-sm">
              …
            </div>
          }
        >
          <AdminAcceptInvitePanel />
        </Suspense>
      </div>
    </div>
  );
}
