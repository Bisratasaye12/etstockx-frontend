"use client";

import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/shared/store/hooks";
import {
  setSidebarCollapsed,
  toggleSidebarCollapsed,
} from "@/shared/store/ui-slice";

const STORAGE_KEY = "etstockx-sidebar-collapsed";

export function useSidebarCollapsed() {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true" || stored === "false") {
        dispatch(setSidebarCollapsed(stored === "true"));
      }
    } catch {
      /* ignore */
    }
  }, [dispatch]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const toggle = useCallback(() => {
    dispatch(toggleSidebarCollapsed());
  }, [dispatch]);

  const setCollapsed = useCallback(
    (value: boolean) => {
      dispatch(setSidebarCollapsed(value));
    },
    [dispatch],
  );

  return { collapsed, toggle, setCollapsed };
}
