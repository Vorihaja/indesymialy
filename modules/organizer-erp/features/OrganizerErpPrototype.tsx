"use client";

import {
  useEffect,
  useRef,
} from "react";

import {
  organizerModules,
} from "../config/navigation";

import type {
  OrganizerModuleId,
} from "../types";

import {
  OrganizerSidebar,
} from "../components/OrganizerSidebar";

import {
  OrganizerTabs,
} from "../components/OrganizerTabs";

import {
  RealModuleDataView,
} from "../components/RealModuleDataView";

import {
  OrganizerSettingsView,
} from "../components/OrganizerSettingsView";

import {
  OrganizerOverviewFeature,
} from "./OrganizerOverviewFeature";

import {
  FightCenterFeature,
} from "../fight-center";

import {
  useErpNavigationState,
} from "@/modules/erp-navigation";

import {
  ErpWorkspaceFrame,
} from "@/modules/erp-core";

type OrganizerErpPrototypeProps = {
  initialModule?: OrganizerModuleId;
  initialEventAction?: "create";
  initialEventId?: string;
};

export function OrganizerErpPrototype({
  initialModule: initialModuleProp,
  initialEventAction,
  initialEventId,
}: OrganizerErpPrototypeProps) {
  const {
    moduleId,
    activeTab,
    selectModule,
    setActiveTab,
  } = useErpNavigationState<OrganizerModuleId>({
    workspace: "organizer",
    modules: organizerModules,
    defaultModuleId: "overview",
    initialModuleId: initialModuleProp,
    legacyStorageKeys: [
      "indesy:organizer-erp:navigation:v2",
    ],
  });

  const activeModule =
    organizerModules.find(
      (item) => item.id === moduleId,
    ) ?? organizerModules[0]!;

  const mainRef =
    useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [
    moduleId,
    activeTab,
  ]);

  const renderContent = () => {
    if (
      activeModule.id ===
        "overview" &&
      activeTab === "Synthèse"
    ) {
      return (
        <OrganizerOverviewFeature
          onNavigate={
            selectModule
          }
        />
      );
    }

    if (
      activeModule.id ===
      "fight-center"
    ) {
      return (
        <FightCenterFeature
          tab={
            activeTab ||
            "Fight Card"
          }
          onTabChange={
            setActiveTab
          }
        />
      );
    }

    if (
      activeModule.id ===
      "settings"
    ) {
      return (
        <OrganizerSettingsView
          tab={
            activeTab ||
            "Organisation"
          }
          onTabChange={
            setActiveTab
          }
        />
      );
    }

    return (
      <RealModuleDataView
        role="organizer"
        moduleId={
          activeModule.id
        }
        moduleLabel={
          activeModule.label
        }
        tab={
          activeTab ||
          activeModule.label
        }
        onTabChange={
          setActiveTab
        }
        autoOpenCreate={
          initialEventAction ===
          "create"
        }
        initialEventId={
          initialEventId
        }
      />
    );
  };

  return (
    <ErpWorkspaceFrame
      ariaLabel="ERP Organisateur"
      sidebar={(
        <OrganizerSidebar
          active={moduleId}
          onChange={
            selectModule
          }
        />
      )}
      tabs={
        activeModule.tabs.length > 1
          ? (
            <OrganizerTabs
              tabs={
                activeModule.tabs
              }
              active={
                activeTab
              }
              onChange={
                setActiveTab
              }
            />
          )
          : undefined
      }
      mainRef={mainRef}
    >
      {renderContent()}
    </ErpWorkspaceFrame>
  );
}
