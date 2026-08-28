"use client";

import {
  useEffect,
  useRef,
} from "react";

import { fighterModules } from "../config/navigation";
import type { FighterModuleId } from "../types";
import { FighterSidebar } from "../components/FighterSidebar";
import { FighterTabs } from "../components/FighterTabs";
import { RealModuleDataView } from "@/modules/organizer-erp/components/RealModuleDataView";
import { useErpNavigationState } from "@/modules/erp-navigation";
import { ErpWorkspaceFrame } from "@/modules/erp-core";

type FighterErpPrototypeProps = {
  initialModule?: FighterModuleId;
  initialTab?: string;
};

export function FighterErpPrototype({
  initialModule,
  initialTab,
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
      <RealModuleDataView
        role="fighter"
        moduleId={activeModule.id}
        moduleLabel={activeModule.label}
        tab={activeTab || activeModule.label}
        onTabChange={setActiveTab}
      />
    </ErpWorkspaceFrame>
  );
}
