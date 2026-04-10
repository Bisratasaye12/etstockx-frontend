"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter, routing } from "@/shared/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className="text-muted-foreground flex items-center gap-2 text-sm">
      <span className="sr-only">Language</span>
      <select
        className="border-input bg-background rounded-md border px-2 py-1"
        value={locale}
        onChange={(e) => {
          const next = e.target.value as (typeof routing.locales)[number];
          router.replace(pathname, { locale: next });
        }}
      >
        {routing.locales.map((l) => (
          <option key={l} value={l}>
            {l === "en" ? "English" : "አማርኛ"}
          </option>
        ))}
      </select>
    </label>
  );
}
