"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/features/errors/components/error-screen";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const details =
    process.env.NODE_ENV === "development"
      ? error.message || error.digest
      : null;

  return <ErrorScreen code="500" onRetry={reset} details={details} />;
}
