import { redirect } from "@/shared/i18n/routing";

/** Legacy URL; OpenAPI v1 MFA at login is TOTP-only — use `/login/mfa`. */
export default async function LoginMfaSmsRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const q =
    typeof sp.callbackUrl === "string" && sp.callbackUrl.startsWith("/")
      ? `?callbackUrl=${encodeURIComponent(sp.callbackUrl)}`
      : "";
  redirect({ href: `/login/mfa${q}`, locale });
}
