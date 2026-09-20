"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { getUniversalRoleDefinition } from "../config";
import type { UniversalRoleId } from "../types";
import { UniversalSidebar } from "./UniversalSidebar";
import { SellerErpModuleView } from "./SellerErpModuleView";
import { FinanceFeature } from "@/modules/finance-erp/features/FinanceFeature";
import { personnelEnabledRoles } from "@/modules/personnel-erp/config";
import { RealModuleDataView } from "@/modules/organizer-erp/components/RealModuleDataView";
import type { RealErpRole } from "@/modules/erp-core/real-data";
import {
  ErpModuleTabs,
  ErpWorkspaceFrame,
} from "@/modules/erp-core";
import { useErpNavigationState } from "@/modules/erp-navigation";
import { ErpCalendarWorkspace } from "@/modules/erp-calendar/components/ErpCalendarWorkspace";
import { OfficialAssignmentsFeature } from "@/modules/officials/assignments";
import { OfficialAvailabilityFeature } from "@/modules/officials/availability";
import {
  getEffectiveOfficialModules,
  OFFICIAL_ADDITIONAL_MODULES,
  useOfficialFunction,
} from "@/modules/officials/function-context";

type UniversalErpPrototypeProps = {
  role: UniversalRoleId;
  initialModule?: string;
  initialTab?: string;
  routeContent?: import("react").ReactNode;
};

const OFFICIAL_MODULE_ROUTES: Readonly<Record<string, string>> = {
  overview: "/dashboard/officiel",
  assignments: "/dashboard/officiel/assignments",
  scorecards: "/dashboard/officiel/scorecards",
  fights: "/dashboard/officiel/fights",
  availability: "/dashboard/officiel/availability",
  licenses: "/dashboard/officiel/licenses",
  training: "/dashboard/officiel/training",
  evaluations: "/dashboard/officiel/evaluations",
  finance: "/dashboard/officiel/finance",
  communication: "/dashboard/officiel/messages",
  settings: "/dashboard/officiel/settings",
  live: "/dashboard/officiel/fight-live",
  calendar: "/dashboard/officiel/calendar",
  marketplace: "/dashboard/officiel/marketplace",
  performance: "/dashboard/officiel/performance",
};

export function UniversalErpPrototype({
  role,
  initialModule,
  initialTab,
  routeContent,
}: UniversalErpPrototypeProps) {
  const router = useRouter();
  const {
    officialFunction,
    officialFunctionReady,
  } = useOfficialFunction();

  const definition = useMemo(() => {
    const base = getUniversalRoleDefinition(role);
    const modules = [...base.modules];

    if (role === "official") {
      for (
        const additionalModule of
        OFFICIAL_ADDITIONAL_MODULES
      ) {
        if (
          !modules.some(
            (item) =>
              item.id === additionalModule.id,
          )
        ) {
          const targetIndex =
            additionalModule.id ===
            "scorecards"
              ? modules.findIndex(
                  (item) =>
                    item.id ===
                    "assignments",
                ) + 1
              : modules.findIndex(
                  (item) =>
                    item.id ===
                    "finance",
                );

          modules.splice(
            targetIndex <= 0
              ? modules.length
              : targetIndex,
            0,
            additionalModule,
          );
        }
      }
    }

    if (personnelEnabledRoles.has(role)) {
      const personnel = {
        id: "personnel",
        label: "Personnel",
        tabs: [],
        icon: "users" as const,
      };

      const settingsIndex = modules.findIndex(
        (module) => module.id === "settings",
      );

      modules.splice(
        settingsIndex < 0
          ? modules.length
          : settingsIndex,
        0,
        personnel,
      );
    }

    const calendar = {
      id: "calendar",
      label: "Agenda",
      tabs: [],
      icon: "calendar" as const,
    };

    const calendarIndex = modules.findIndex(
      (module) => module.id === "settings",
    );

    modules.splice(
      calendarIndex < 0
        ? modules.length
        : calendarIndex,
      0,
      calendar,
    );

    if (
      !modules.some(
        (module) => module.id === "marketplace",
      )
    ) {
      const marketplace = {
        id: "marketplace",
        label: "Marketplace",
        tabs: [],
        icon: "commerce" as const,
      };

      const marketplaceIndex = modules.findIndex(
        (module) => module.id === "calendar",
      );

      modules.splice(
        marketplaceIndex < 0
          ? modules.length
          : marketplaceIndex,
        0,
        marketplace,
      );
    }

    const financeIndex = modules.findIndex(
      (module) => module.id === "finance",
    );

    if (financeIndex >= 0) {
      modules[financeIndex] = {
        ...modules[financeIndex]!,
        label: "Finances",
        tabs: [],
      };
    } else {
      const settingsIndex = modules.findIndex(
        (module) => module.id === "settings",
      );

      modules.splice(
        settingsIndex < 0
          ? modules.length
          : settingsIndex,
        0,
        {
          id: "finance",
          label: "Finances",
          tabs: [],
          icon: "finance" as const,
        },
      );
    }

    return {
      ...base,
      modules:
        role === "official"
          ? getEffectiveOfficialModules(
              modules,
              officialFunction,
            )
          : modules,
    };
  }, [officialFunction, role]);

  const {
    moduleId,
    activeTab,
    selectModule: navigate,
    setActiveTab,
  } = useErpNavigationState<string>({
    workspace: role,
    modules: definition.modules,
    defaultModuleId: "overview",
    initialModuleId: initialModule,
    initialTab,
  });

  const navigateFromSidebar = useCallback((nextModuleId: string) => {
    if (role === "official") {
      const route = OFFICIAL_MODULE_ROUTES[nextModuleId];

      if (route) {
        router.push(route);
        return;
      }
    }

    navigate(nextModuleId);
  }, [navigate, role, router]);

  const routeDeterminesModule =
    role === "official" && initialModule !== undefined;
  const effectiveModuleId = routeDeterminesModule
    ? initialModule
    : moduleId;
  const effectiveActiveTab =
    routeDeterminesModule && initialTab !== undefined
      ? initialTab
      : activeTab;

  const activeModule =
    definition.modules.find(
      (module) => module.id === effectiveModuleId,
    ) ?? definition.modules[0]!;

  const requestedModuleIsAvailable =
    initialModule === undefined ||
    definition.modules.some(
      (module) =>
        module.id === initialModule,
    );

  useEffect(() => {
    if (
      role === "official" &&
      officialFunctionReady &&
      !requestedModuleIsAvailable
    ) {
      router.replace(
        "/dashboard/officiel",
      );
    }
  }, [
    requestedModuleIsAvailable,
    officialFunctionReady,
    role,
    router,
  ]);

  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [effectiveModuleId, effectiveActiveTab]);

  return (
    <ErpWorkspaceFrame
      ariaLabel={`ERP ${definition.label}`}
      sidebar={
        <UniversalSidebar
          definition={definition}
          active={effectiveModuleId}
          onChange={navigateFromSidebar}
        />
      }
      tabs={
        activeModule.tabs.length > 1 ? (
          <ErpModuleTabs
            tabs={activeModule.tabs}
            active={effectiveActiveTab}
            onChange={setActiveTab}
            ariaLabel={`Sous-navigation ${activeModule.label}`}
          />
        ) : undefined
      }
      mainRef={mainRef}
    >
      {role === "official" &&
      effectiveModuleId === "scorecards" ? (
        routeContent ?? (
          <p className="p-6 text-sm text-red-500">
            Le module Scorecards est indisponible.
          </p>
        )
      ) : routeContent &&
      effectiveModuleId === (initialModule ?? "overview") &&
      (
        activeModule.id === "finance" ||
        !initialTab ||
        effectiveActiveTab === initialTab
      ) ? (
        routeContent
      ) : activeModule.id === "finance" ? (
        <FinanceFeature role={role} />
      ) : activeModule.id === "availability" && role === "official" ? (
        <OfficialAvailabilityFeature />
      ) : activeModule.id === "calendar" &&
      role !== "seller" ? (
        <ErpCalendarWorkspace role={role} />
      ) : activeModule.id === "assignments" &&
      (role === "official" || role === "referee") ? (
        <OfficialAssignmentsFeature
          tab={effectiveActiveTab || "upcoming"}
        />
      ) : role === "seller" ? (
        <SellerErpModuleView
          moduleId={activeModule.id}
          moduleLabel={activeModule.label}
          tab={effectiveActiveTab}
          onTabChange={setActiveTab}
        />
      ) : (
        <RealModuleDataView
          role={role as RealErpRole}
          moduleId={activeModule.id}
          moduleLabel={activeModule.label}
          tab={effectiveActiveTab || activeModule.label}
          onTabChange={setActiveTab}
        />
      )}
    </ErpWorkspaceFrame>
  );
}
