"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export function AuthLoginTopBar() {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");

  return (
    <header className="border-border bg-background shrink-0 border-b">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="relative block h-10 w-[180px] shrink-0 sm:w-[200px]">
            <Image
              src="/EtStockX.svg"
              alt={tCommon("appName")}
              fill
              className="object-contain object-left"
              sizes="(max-width: 640px) 180px, 200px"
              unoptimized
              priority
            />
          </span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="#help"
            className="text-muted-foreground hover:text-foreground hidden text-sm font-medium sm:inline"
          >
            {t("authTopHelp")}
          </Link>
          <LocaleSwitcher />
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "sm" }), "h-9 px-4 text-sm")}
          >
            {tNav("getStarted")}
          </Link>
        </div>
      </div>
    </header>
  );
}
