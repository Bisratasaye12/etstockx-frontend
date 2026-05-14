import { redirect } from "@/shared/i18n/routing";

export default async function AdminSettingsRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/profile/admin", locale });
}
