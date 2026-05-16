"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center p-6 font-sans antialiased">
        <div className="border-border bg-card w-full max-w-lg space-y-6 rounded-2xl border p-8 text-center shadow-sm">
          <p className="text-destructive text-5xl font-bold">500</p>
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            A critical error occurred. Please try again or return to the home
            page.
          </p>
          {process.env.NODE_ENV === "development" && error.message ? (
            <p className="text-muted-foreground border-border bg-muted/40 rounded-lg border px-3 py-2 font-mono text-xs break-all">
              {error.message}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/en";
              }}
              className="border-border inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium"
            >
              Go home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
