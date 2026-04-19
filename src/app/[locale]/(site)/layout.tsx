import { SiteHeader } from "@/shared/ui/site-header";
import { SiteFooter } from "@/shared/ui/site-footer";

export default function SiteChromeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
