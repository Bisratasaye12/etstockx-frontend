import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { safeAuth } from "@/shared/lib/safe-auth";
import { Link } from "@/shared/i18n/routing";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { MarketingNavLink } from "@/shared/ui/marketing-nav-link";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const session = await safeAuth();

  return (
    <header className="border-border bg-card/80 supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 md:h-16">
        <div className="flex min-w-0 flex-1 items-center gap-8 lg:gap-10">
          <Link href="/" className="flex shrink-0 items-center">
            <span className="relative block h-9 w-[168px] sm:h-10 sm:w-[188px]">
              <Image
                src="/EtStockX.svg"
                alt={tCommon("appName")}
                fill
                className="object-contain object-left"
                sizes="(max-width: 640px) 168px, 188px"
                unoptimized
                priority
              />
            </span>
          </Link>
          {session ? (
            <nav className="hidden flex-wrap items-center gap-4 text-sm sm:flex md:gap-6">
              <Link
                href="/"
                className="text-muted-foreground hover:text-foreground"
              >
                {t("home")}
              </Link>
              <MarketingNavLink href="/market">
                {t("listings")}
              </MarketingNavLink>
              <Link
                href={
                  session.user?.role === "Admin"
                    ? "/admin/overview"
                    : "/dashboard"
                }
                className="text-muted-foreground hover:text-foreground"
              >
                {session.user?.role === "Admin"
                  ? t("adminPortal")
                  : t("dashboard")}
              </Link>
              {session.user?.role === "Client" ? (
                <Link
                  href="/profile/client"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("profile")}
                </Link>
              ) : null}
              {session.user?.role === "Broker" ||
              session.user?.role === "Dealer" ? (
                <Link
                  href="/profile/broker"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("profile")}
                </Link>
              ) : null}
            </nav>
          ) : (
            <nav className="hidden items-center gap-5 text-sm md:flex md:gap-6 lg:gap-8">
              <MarketingNavLink href="/market">
                {t("listings")}
              </MarketingNavLink>
              <MarketingNavLink href="/brokers">
                {t("brokers")}
              </MarketingNavLink>
              <Link
                href="/#how-it-works"
                className="text-muted-foreground hover:text-foreground font-medium"
              >
                {t("howItWorks")}
              </Link>
              <Link
                href="/#about"
                className="text-muted-foreground hover:text-foreground font-medium"
              >
                {t("about")}
              </Link>
            </nav>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <LocaleSwitcher />
          {session ? (
            <SignOutButton label={t("signOut")} />
          ) : (
            <>
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground hidden text-sm font-medium sm:inline"
              >
                {t("signIn")}
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "hidden sm:inline-flex h-10 px-5 text-sm",
                )}
              >
                {t("getStarted")}
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "h-10 px-5 text-sm sm:hidden",
                )}
              >
                {t("signIn")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
