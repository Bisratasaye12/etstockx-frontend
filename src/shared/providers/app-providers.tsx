"use client";

import { useEffect, useRef } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { SessionProvider, useSession } from "next-auth/react";
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { makeStore } from "@/shared/store";
import { attachBrowserApiAuth } from "@/shared/api/browser-api";

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

function ApiAuthBridge({ children }: { children: React.ReactNode }) {
  const { data: session, update } = useSession();
  const tokenRef = useRef(session?.accessToken);

  useEffect(() => {
    tokenRef.current = session?.accessToken;
  }, [session?.accessToken]);

  useEffect(() => {
    const detach = attachBrowserApiAuth(
      () => tokenRef.current,
      async (tokens) => {
        tokenRef.current = tokens.accessToken;
        await update({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
      },
    );
    return detach;
  }, [update]);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ReduxProvider store={reduxStore}>
          <ApiAuthBridge>{children}</ApiAuthBridge>
        </ReduxProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
