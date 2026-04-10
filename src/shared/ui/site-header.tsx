import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Link } from "@/shared/i18n/routing";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { SignOutButton } from "@/features/auth/components/sign-out-button";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const session = await auth();

  return (
    <header className="border-border bg-card/80 supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-foreground font-semibold tracking-tight">
          EtStockX
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground"
          >
            {t("home")}
          </Link>
          <Link
            href="/market"
            className="text-muted-foreground hover:text-foreground"
          >
            {t("market")}
          </Link>
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground"
              >
                {t("dashboard")}
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
              {session.user?.role === "Admin" ? (
                <Link
                  href="/admin/brokers"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("adminBrokers")}
                </Link>
              ) : null}
              <SignOutButton label={t("signOut")} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground"
              >
                {t("signIn")}
              </Link>
              <Link
                href="/register"
                className="text-primary font-medium hover:underline"
              >
                {t("register")}
              </Link>
            </>
          )}
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}
