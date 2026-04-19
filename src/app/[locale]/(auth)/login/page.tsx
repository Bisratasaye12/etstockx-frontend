import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Search, ShieldCheck, Zap } from "lucide-react";
import { AuthLoginFooter } from "@/features/auth/components/auth-login-footer";
import { AuthLoginTopBar } from "@/features/auth/components/auth-login-top-bar";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage() {
  const t = await getTranslations("auth");

  const valueProps = [
    {
      Icon: ShieldCheck,
      title: t("loginAsideValue1Title"),
      body: t("loginAsideValue1Body"),
    },
    {
      Icon: Zap,
      title: t("loginAsideValue2Title"),
      body: t("loginAsideValue2Body"),
    },
    {
      Icon: Search,
      title: t("loginAsideValue3Title"),
      body: t("loginAsideValue3Body"),
    },
  ] as const;

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <AuthLoginTopBar />
      <div className="grid min-h-0 w-full flex-1 lg:grid-cols-[minmax(280px,38%)_1fr]">
        <aside className="bg-primary text-primary-foreground flex flex-col justify-between gap-10 px-8 py-10 max-lg:px-6 max-lg:py-8">
          <div className="flex flex-col gap-10">
            <div>
              <h1 className="font-heading text-primary-foreground text-3xl leading-tight font-bold tracking-tight md:text-4xl">
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
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="border-primary-foreground/30 bg-primary-foreground/20 size-10 shrink-0 rounded-full border-2"
                    aria-hidden
                  />
                ))}
              </div>
              <p className="text-primary-foreground/90 text-sm leading-snug">
                {t("loginSocialProof")}
              </p>
            </div>
          </div>
        </aside>
        <div className="flex flex-col justify-center">
          <Suspense
            fallback={
              <div className="text-muted-foreground p-8 text-sm">…</div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>
      <AuthLoginFooter />
    </div>
  );
}
