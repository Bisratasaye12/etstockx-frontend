"use client";

import { useCallback, useEffect, useRef } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { makeStore } from "@/shared/store";
import { attachBrowserApiAuth } from "@/shared/api/browser-api";
import { AuthReduxSync } from "@/features/auth/components/auth-redux-sync";
import { ToastProvider } from "@/shared/ui/toast";

const queryClient = new QueryClient({
  queryCache: new QueryCache(),
  mutationCache: new MutationCache(),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

const reduxStore = makeStore();

function loginPathForLocale(locale: string): string {
  return `/${locale}/login`;
}

function ApiAuthBridge({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const { data: session, update } = useSession();
  const tokenRef = useRef(session?.accessToken);

  useEffect(() => {
    tokenRef.current = session?.accessToken;
  }, [session?.accessToken]);

  const onRefreshFailed = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("[auth] logout after refresh failure failed", error);
    }

    await signOut({ redirect: false });
    window.location.assign(loginPathForLocale(locale));
  }, [locale]);

  useEffect(() => {
    const detach = attachBrowserApiAuth(
      () => tokenRef.current,
      async (tokens) => {
        tokenRef.current = tokens.accessToken;
        await update({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          ...(typeof tokens.isActivated === "boolean"
            ? { isActivated: tokens.isActivated }
            : {}),
        });
      },
      onRefreshFailed,
    );
    return detach;
  }, [update, onRefreshFailed]);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ReduxProvider store={reduxStore}>
          <AuthReduxSync />
          <ToastProvider>
            <ApiAuthBridge>{children}</ApiAuthBridge>
          </ToastProvider>
        </ReduxProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
