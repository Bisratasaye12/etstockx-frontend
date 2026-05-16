import Link from "next/link";
import { routing } from "@/shared/i18n/routing";

export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center p-6 font-sans antialiased">
        <div className="border-border bg-card w-full max-w-md space-y-6 rounded-2xl border p-8 text-center shadow-sm">
          <p className="text-primary text-5xl font-bold">404</p>
          <h1 className="text-xl font-semibold">Page not found</h1>
          <p className="text-muted-foreground text-sm">
            The page you requested does not exist or may have been moved.
          </p>
          <Link
            href={`/${routing.defaultLocale}`}
            className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium"
          >
            Go to EtStockX
          </Link>
        </div>
      </body>
    </html>
  );
}
