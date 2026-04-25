import { getTranslations } from "next-intl/server";
import { Link } from "@/shared/i18n/routing";

export async function SiteFooter() {
  const t = await getTranslations("home");
  const year = new Date().getFullYear();

  return (
    <footer
      id="about"
      className="bg-muted/50 border-border/60 border-t px-5 py-12 md:px-8"
    >
      <div className="mx-auto max-w-[1600px] text-center">
        <p className="font-heading text-lg font-bold">{t("footerBrand")}</p>
        <nav
          className="text-muted-foreground mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm"
          aria-label="Footer"
        >
          <Link
            href="#privacy"
            className="hover:text-foreground transition-colors"
          >
            {t("footerPrivacy")}
          </Link>
          <Link
            href="#terms"
            className="hover:text-foreground transition-colors"
          >
            {t("footerTerms")}
          </Link>
          <Link
            href="#regulatory"
            className="hover:text-foreground transition-colors"
          >
            {t("footerRegulatory")}
          </Link>
          <Link
            href="#brokers-guide"
            className="hover:text-foreground transition-colors"
          >
            {t("footerBrokerGuidelines")}
          </Link>
          <Link
            href="#contact"
            className="hover:text-foreground transition-colors"
          >
            {t("footerContact")}
          </Link>
          <Link href="#faq" className="hover:text-foreground transition-colors">
            {t("footerFaq")}
          </Link>
        </nav>
        <p className="text-muted-foreground mx-auto mt-10 max-w-3xl text-xs leading-relaxed">
          {t("footerLegal", { year })}
        </p>
      </div>
    </footer>
  );
}
