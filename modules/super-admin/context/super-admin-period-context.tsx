"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type {
  AnalyticsPeriodDays,
} from "../types";

interface SuperAdminPeriodContextValue {
  days: AnalyticsPeriodDays;
  setDays: (days: AnalyticsPeriodDays) => void;
  from: Date;
  to: Date;
  refreshToken: number;
  refresh: () => void;
}

const SuperAdminPeriodContext =
  createContext<SuperAdminPeriodContextValue | null>(
    null,
  );

export function SuperAdminPeriodProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [days, setDays] =
    useState<AnalyticsPeriodDays>(30);

  const [refreshToken, setRefreshToken] =
    useState(0);

  const refresh = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  const dates = useMemo(() => {
    const to = new Date();
    const from = new Date(to);

    from.setDate(
      from.getDate() - days,
    );

    return {
      from,
      to,
    };
  }, [
    days,
    refreshToken,
  ]);

  const value = useMemo(
    () => ({
      days,
      setDays,
      from: dates.from,
      to: dates.to,
      refreshToken,
      refresh,
    }),
    [
      days,
      dates,
      refresh,
      refreshToken,
    ],
  );

  return (
    <SuperAdminPeriodContext.Provider
      value={value}
    >
      {children}
    </SuperAdminPeriodContext.Provider>
  );
}

export function useSuperAdminPeriod() {
  const context = useContext(
    SuperAdminPeriodContext,
  );

  if (!context) {
    throw new Error(
      "useSuperAdminPeriod doit être utilisé dans SuperAdminPeriodProvider.",
    );
  }

  return context;
}
