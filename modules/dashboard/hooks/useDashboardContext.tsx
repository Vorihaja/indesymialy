"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  DashboardContextType,
} from "../types";

const DashboardContext =
  createContext<
    DashboardContextType | undefined
  >(undefined);

export function DashboardProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false);

  useEffect(() => {
    const stored =
      window.localStorage.getItem(
        "indesy:erp-sidebar-collapsed",
      );

    if (stored !== null) {
      setSidebarCollapsed(
        stored === "true",
      );
    }

    const resize = () => {
      if (
        window.innerWidth < 1024 &&
        window.innerWidth >= 768
      ) {
        setSidebarCollapsed(true);
        return;
      }

      if (
        window.innerWidth >= 1024 &&
        window.localStorage.getItem(
          "indesy:erp-sidebar-collapsed",
        ) === null
      ) {
        setSidebarCollapsed(false);
      }
    };

    resize();

    window.addEventListener(
      "resize",
      resize,
      {
        passive: true,
      },
    );

    return () =>
      window.removeEventListener(
        "resize",
        resize,
      );
  }, []);

  useEffect(() => {
    if (
      window.innerWidth < 900
    ) {
      setSidebarOpen(false);
    }
  }, [sidebarCollapsed]);

  const value =
    useMemo<DashboardContextType>(
      () => ({
        sidebarOpen,
        sidebarCollapsed,
        setSidebarOpen,

        toggleSidebar: () =>
          setSidebarOpen(
            (previous) =>
              !previous,
          ),

        setSidebarCollapsed,

        toggleCollapsed: () =>
          setSidebarCollapsed(
            (previous) => {
              const next =
                !previous;

              window.localStorage.setItem(
                "indesy:erp-sidebar-collapsed",
                String(next),
              );

              return next;
            },
          ),
      }),
      [
        sidebarOpen,
        sidebarCollapsed,
      ],
    );

  return (
    <DashboardContext.Provider
      value={value}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context =
    useContext(
      DashboardContext,
    );

  if (!context) {
    throw new Error(
      "useDashboardContext doit être utilisé dans DashboardProvider",
    );
  }

  return context;
}
