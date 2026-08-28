"use client";

import {
  useEffect,
  useMemo,
  useRef,
} from "react";
import { getUniversalRoleDefinition } from "../config";
import type { UniversalRoleId } from "../types";
import { UniversalSidebar } from "./UniversalSidebar";
import { personnelEnabledRoles } from "@/modules/personnel-erp";
import { RealModuleDataView } from "@/modules/organizer-erp/components/RealModuleDataView";
import type { RealErpRole } from "@/modules/erp-core/real-data";
import {
  ErpModuleTabs,
  ErpWorkspaceFrame,
} from "@/modules/erp-core";
import { useErpNavigationState } from "@/modules/erp-navigation";

type UniversalErpPrototypeProps = {
  role: UniversalRoleId;
  initialModule?: string;
  initialTab?: string;
};

export function UniversalErpPrototype({
  role,
  initialModule,
  initialTab,
}: UniversalErpPrototypeProps) {
  const definition = useMemo(() => {
    const base = getUniversalRoleDefinition(role);
    const modules = [...base.modules];

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
        tabs: [
          "Synthèse",
          ...modules[financeIndex]!.tabs.filter(
            (tab) => tab !== "Synthèse",
          ),
        ],
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
          tabs: ["Synthèse"],
          icon: "finance" as const,
        },
      );
    }

    return {
      ...base,
      modules,
    };
  }, [role]);

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

  const activeModule =
    definition.modules.find(
      (module) => module.id === moduleId,
    ) ?? definition.modules[0]!;

  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [moduleId, activeTab]);

  return (
    <ErpWorkspaceFrame
      ariaLabel={`ERP ${definition.label}`}
      sidebar={
        <UniversalSidebar
          definition={definition}
          active={moduleId}
          onChange={navigate}
        />
      }
      tabs={
        activeModule.tabs.length > 1 ? (
          <ErpModuleTabs
            tabs={activeModule.tabs}
            active={activeTab}
            onChange={setActiveTab}
            ariaLabel={`Sous-navigation ${activeModule.label}`}
          />
        ) : undefined
      }
      mainRef={mainRef}
    >
      <RealModuleDataView
        role={role as RealErpRole}
        moduleId={activeModule.id}
        moduleLabel={activeModule.label}
        tab={activeTab || activeModule.label}
        onTabChange={setActiveTab}
      />
    </ErpWorkspaceFrame>
  );
}
