"use client";

import {
  useEffect,
  useRef,
} from "react";
import type { ReactNode } from "react";

import { fighterModules } from "../config/navigation";
import type { FighterModuleId } from "../types";
import { FighterSidebar } from "../components/FighterSidebar";
import { FighterTabs } from "../components/FighterTabs";
import { RealModuleDataView } from "@/modules/organizer-erp/components/RealModuleDataView";
import { useErpNavigationState } from "@/modules/erp-navigation";
import { ErpWorkspaceFrame } from "@/modules/erp-core";
import { ErpCalendarWorkspace } from "@/modules/erp-calendar";
import { FinanceFeature } from "@/modules/finance-erp/features/FinanceFeature";

type FighterErpPrototypeProps = {
  initialModule?: FighterModuleId;
  initialTab?: string;
  routeContent?: ReactNode;
};

export function FighterErpPrototype({
  initialModule,
  initialTab,
  routeContent,
}: FighterErpPrototypeProps = {}) {
  const {
    moduleId,
    activeTab,
    selectModule,
    setActiveTab,
  } = useErpNavigationState<FighterModuleId>({
    workspace: "fighter",
    modules: fighterModules,
    defaultModuleId: "overview",
    initialModuleId: initialModule,
    initialTab,
  });

  const activeModule =
    fighterModules.find(
      (item) => item.id === moduleId,
    ) ?? fighterModules[0]!;

  const mainRef = useRef<HTMLElement>(null);

  const renderRouteContent =
    routeContent !== undefined &&
    activeModule.id === (initialModule ?? "overview") &&
    (
      activeModule.id === "finance" ||
      !initialTab ||
      activeTab === initialTab
    );

  useEffect(() => {
    mainRef.current?.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [moduleId, activeTab]);

  return (
    <ErpWorkspaceFrame
      ariaLabel="ERP Combattant"
      sidebar={(
        <FighterSidebar
          active={moduleId}
          onChange={selectModule}
        />
      )}
      tabs={
        activeModule.tabs.length > 1
          ? (
            <FighterTabs
              tabs={activeModule.tabs}
              active={activeTab}
              onChange={setActiveTab}
            />
          )
          : undefined
      }
      mainRef={mainRef}
    >
      {renderRouteContent ? (
        routeContent
      ) : activeModule.id === "calendar" ? (
        <ErpCalendarWorkspace role="fighter" />
      ) : activeModule.id === "finance" ? (
        <FinanceFeature role="combattant" />
      ) : (
        <RealModuleDataView
          role="fighter"
          moduleId={activeModule.id}
          moduleLabel={activeModule.label}
          tab={activeTab || activeModule.label}
          onTabChange={setActiveTab}
        />
      )}
    </ErpWorkspaceFrame>
  );
}
