import { safeAuth } from "@/shared/lib/safe-auth";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/shared/i18n/routing";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { InvestorOverview } from "@/features/investor/components/investor-overview";
import {
  isAdminRole,
  isBrokerPortalRole,
  isClientRole,
} from "@/shared/lib/user-role";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await safeAuth();
  const t = await getTranslations("dashboard");

  if (isAdminRole(session?.user?.role)) {
    redirect({ href: "/admin/overview", locale });
  }

  if (isBrokerPortalRole(session?.user?.role)) {
    redirect({ href: "/dashboard/broker", locale });
  }

  if (isClientRole(session?.user?.role)) {
    return <InvestorOverview />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("welcome")}
          {session?.user?.email ? ` — ${session.user.email}` : null}
        </p>
        <dl className="text-muted-foreground mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-foreground">{t("role")}</dt>
            <dd>{session?.user?.role ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">{t("activated")}</dt>
            <dd>{session?.user?.isActivated ? "Yes" : t("notActivated")}</dd>
          </div>
        </dl>
      </div>
      <div className="border-border grid gap-4 rounded-xl border p-4 md:grid-cols-2">
        <div>
          <h2 className="font-medium">Market</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("stubMarket")}
          </p>
          <Link
            href="/market"
            className={cn(buttonVariants({ variant: "link" }), "mt-2 px-0")}
          >
            Market
          </Link>
        </div>
        <div>
          <h2 className="font-medium">Trading</h2>
          <p className="text-muted-foreground mt-1 text-sm">{t("stubTrade")}</p>
        </div>
      </div>
      {isClientRole(session?.user?.role) ? (
        <Link
          href="/profile/client"
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}
        >
          Investor profile
        </Link>
      ) : null}
    </div>
  );
}
