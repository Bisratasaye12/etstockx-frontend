import { getTranslations } from "next-intl/server";
import { Link } from "@/shared/i18n/routing";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export default async function HomePage() {
  const t = await getTranslations("home");

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          {t("description")}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/register"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            {t("ctaRegister")}
          </Link>
          <Link
            href="/market"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            {t("ctaMarket")}
          </Link>
        </div>
      </section>
    </div>
  );
}
