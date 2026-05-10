import { SiteHeader } from "@/shared/ui/site-header";
import { SiteFooter } from "@/shared/ui/site-footer";
import { auth } from "@/auth";
import { AuthenticatedShell } from "@/shared/ui/authenticated-shell";
import type { UserRole } from "@/shared/api/types";

export default async function SiteChromeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  console.log("layout accessToken", session?.accessToken);

  if (session) {
    return (
      <AuthenticatedShell
        role={session.user?.role as UserRole | undefined}
        accessToken={session.accessToken}
      >
        {children}
      </AuthenticatedShell>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-8 md:px-8">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
