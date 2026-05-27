"use client";

import { useEffect, useRef } from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";

import { getNotificationsHubUrl } from "@/shared/config/env";
import { notificationKeys } from "@/features/notifications/api/keys";

export function NotificationsSignalRProvider() {
  const { data: session, status } = useSession();
  const qc = useQueryClient();

  const connectionRef = useRef<HubConnection | null>(null);
  const lastAccessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    const accessToken = session?.accessToken;
    if (!accessToken) return;

    // If token didn't change, avoid reconnecting on rerenders.
    if (lastAccessTokenRef.current === accessToken) {
      const state = connectionRef.current?.state;
      if (
        state === HubConnectionState.Connected ||
        state === HubConnectionState.Connecting ||
        state === HubConnectionState.Reconnecting
      ) {
        return;
      }
    }
    lastAccessTokenRef.current = accessToken;

    const hubUrl = getNotificationsHubUrl();
    if (!hubUrl) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[notifications] SignalR disabled: set NEXT_PUBLIC_BACKEND_ORIGIN to your API origin (example: http://localhost:5163). REST can keep NEXT_PUBLIC_API_URL=/api/backend.",
        );
      }
      return;
    }
    const devLog = process.env.NODE_ENV === "development";
    if (devLog) {
      console.info("[notifications] SignalR connecting", { hubUrl });
    }

    void connectionRef.current?.stop();
    connectionRef.current = null;

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => accessToken,
        // JWT is sent via access_token query param; do not send cookies (avoids CORS credentials).
        withCredentials: false,
      })
      .configureLogging(devLog ? LogLevel.Information : LogLevel.Warning)
      .withAutomaticReconnect()
      .build();

    const onRealtimeEvent = (eventName: string) => {
      if (devLog) {
        console.info(`[notifications] SignalR event: ${eventName}`);
      }
      void qc.invalidateQueries({ queryKey: notificationKeys.all });
    };

    connection.on("NotificationReceived", () =>
      onRealtimeEvent("NotificationReceived"),
    );
    connection.on("notificationReceived", () =>
      onRealtimeEvent("notificationReceived"),
    );
    connection.on("NotificationRead", () =>
      onRealtimeEvent("NotificationRead"),
    );
    connection.on("notificationRead", () =>
      onRealtimeEvent("notificationRead"),
    );

    connection.onclose((error) => {
      if (devLog) {
        console.warn("[notifications] SignalR closed", error ?? "no error");
      }
    });

    connection.onreconnecting((error) => {
      if (devLog) {
        console.warn(
          "[notifications] SignalR reconnecting",
          error ?? "no error",
        );
      }
    });

    connection.onreconnected((connectionId) => {
      if (devLog) {
        console.info("[notifications] SignalR reconnected", { connectionId });
      }
    });

    connectionRef.current = connection;

    void connection
      .start()
      .then(() => {
        if (devLog) {
          console.info("[notifications] SignalR connected", {
            connectionId: connection.connectionId,
          });
        }
      })
      .catch((e) => {
        console.error("[notifications] SignalR connection failed", e);
      });

    return () => {
      connection.off("NotificationReceived");
      connection.off("notificationReceived");
      connection.off("NotificationRead");
      connection.off("notificationRead");
      void connection.stop();
    };
  }, [qc, session?.accessToken, status]);

  return null;
}
