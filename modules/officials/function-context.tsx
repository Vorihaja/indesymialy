"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  UniversalModule,
} from "@/modules/universal-erp/types";
import { defineErpTabs } from "@/modules/erp-navigation";
import {
  useAuthContext,
} from "@/providers/auth/auth-context";

export type OfficialFunction =
  | "referee"
  | "judge"
  | "timekeeper"
  | "doctor"
  | "supervisor"
  | "announcer";

export const OFFICIAL_FUNCTION_OPTIONS: ReadonlyArray<{
  value: OfficialFunction;
  label: string;
}> = [
  { value: "referee", label: "Arbitre" },
  { value: "judge", label: "Juge" },
  { value: "timekeeper", label: "Chronométreur" },
  { value: "doctor", label: "Médecin" },
  { value: "supervisor", label: "Superviseur" },
  { value: "announcer", label: "Annonceur" },
];

export const OFFICIAL_COMMON_MODULE_IDS = [
  "overview",
  "assignments",
  "availability",
  "licenses",
  "training",
  "finance",
  "communication",
  "calendar",
  "settings",
] as const;

export const OFFICIAL_FUNCTION_MODULE_IDS: Readonly<
  Record<OfficialFunction, readonly string[]>
> = {
  referee: ["fights", "evaluations", "live"],
  judge: ["scorecards", "fights", "performance"],
  timekeeper: ["fights"],
  doctor: ["fights"],
  supervisor: ["fights", "evaluations"],
  announcer: ["fights"],
};

export const OFFICIAL_ADDITIONAL_MODULES: readonly UniversalModule[] = [
  {
    id: "scorecards",
    label: "Scorecards",
    tabs: [],
    icon: "sport",
  },
  {
    id: "performance",
    label: "Évaluations",
    tabs: defineErpTabs([
      { id: "precision", label: "Précision", legacyIds: ["Précision"] },
      { id: "consistency", label: "Cohérence", legacyIds: ["Cohérence"] },
      { id: "feedback", label: "Feedback", legacyIds: ["Feedback"] },
      { id: "reports", label: "Rapports", legacyIds: ["Rapports"] },
    ]),
    icon: "performance",
  },
];

const OFFICIAL_ACCOUNT_ROLES = new Set([
  "official",
  "referee",
  "judge",
]);

const STORAGE_KEY =
  "indesy:erp:official:function:v1";

function isOfficialFunction(
  value: unknown,
): value is OfficialFunction {
  return OFFICIAL_FUNCTION_OPTIONS.some(
    (option) => option.value === value,
  );
}

export function isOfficialAccountRole(
  value: string,
) {
  return OFFICIAL_ACCOUNT_ROLES.has(value);
}

export function isOfficialModuleVisible(
  officialFunction: OfficialFunction,
  moduleId: string,
) {
  return (
    OFFICIAL_COMMON_MODULE_IDS.includes(
      moduleId as (typeof OFFICIAL_COMMON_MODULE_IDS)[number],
    ) ||
    OFFICIAL_FUNCTION_MODULE_IDS[
      officialFunction
    ].includes(moduleId)
  );
}

export function getEffectiveOfficialModules(
  modules: readonly UniversalModule[],
  officialFunction: OfficialFunction,
) {
  return modules.filter((module) =>
    isOfficialModuleVisible(
      officialFunction,
      module.id,
    ),
  );
}

export function getOfficialModuleIdFromPath(
  pathname: string,
) {
  const basePath = "/dashboard/officiel";

  if (pathname === basePath) {
    return "overview";
  }

  if (!pathname.startsWith(`${basePath}/`)) {
    return null;
  }

  const section =
    pathname.slice(basePath.length + 1).split("/")[0];

  if (section === "messages") {
    return "communication";
  }

  if (section === "fight-live") {
    return "live";
  }

  return section || "overview";
}

type OfficialFunctionContextValue = {
  officialFunction: OfficialFunction;
  officialFunctionReady: boolean;
  setOfficialFunction: (
    value: OfficialFunction,
  ) => void;
};

const OfficialFunctionContext =
  createContext<OfficialFunctionContextValue | null>(
    null,
  );

export function OfficialFunctionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const {
    primaryRole,
    roles,
    loading,
  } = useAuthContext();

  const [
    officialFunction,
    setOfficialFunctionState,
  ] = useState<OfficialFunction>(
    "referee",
  );
  const [
    officialFunctionReady,
    setOfficialFunctionReady,
  ] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    let active = true;

    let stored: string | null = null;

    try {
      stored = window.localStorage.getItem(
        STORAGE_KEY,
      );
    } catch {
      // The workspace remains usable when local storage is unavailable.
    }

    const hasLegacyJudgeRole =
      primaryRole === "judge" ||
      roles.some(
        (role) => role.slug === "judge",
      );

    const hasCanonicalOfficialRole =
      roles.some(
        (role) => role.slug === "official",
      );

    const nextFunction =
      isOfficialFunction(stored)
        ? stored
        : hasLegacyJudgeRole &&
            !hasCanonicalOfficialRole
          ? "judge"
          : "referee";

    queueMicrotask(() => {
      if (active) {
        setOfficialFunctionState(
          nextFunction,
        );
        setOfficialFunctionReady(true);
      }
    });

    return () => {
      active = false;
    };
  }, [loading, primaryRole, roles]);

  useEffect(() => {
    const synchronize = (
      event: StorageEvent,
    ) => {
      if (
        event.key === STORAGE_KEY &&
        isOfficialFunction(event.newValue)
      ) {
        setOfficialFunctionState(
          event.newValue,
        );
      }
    };

    window.addEventListener(
      "storage",
      synchronize,
    );

    return () =>
      window.removeEventListener(
        "storage",
        synchronize,
      );
  }, []);

  const setOfficialFunction =
    useCallback(
      (value: OfficialFunction) => {
        setOfficialFunctionState(value);

        try {
          window.localStorage.setItem(
            STORAGE_KEY,
            value,
          );
        } catch {
          // Persistence is progressive enhancement only.
        }
      },
      [],
    );

  const value = useMemo(
    () => ({
      officialFunction,
      officialFunctionReady,
      setOfficialFunction,
    }),
    [
      officialFunction,
      officialFunctionReady,
      setOfficialFunction,
    ],
  );

  return (
    <OfficialFunctionContext.Provider
      value={value}
    >
      {children}
    </OfficialFunctionContext.Provider>
  );
}

export function useOfficialFunction() {
  const context = useContext(
    OfficialFunctionContext,
  );

  if (!context) {
    throw new Error(
      "useOfficialFunction must be used inside OfficialFunctionProvider.",
    );
  }

  return context;
}
