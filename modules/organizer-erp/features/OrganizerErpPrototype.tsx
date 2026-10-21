"use client";

import {
  useEffect,
  useRef,
} from "react";
import type { ReactNode } from "react";

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
  FightLiveListFeature,
} from "@/modules/fight-live";

import {
  useErpNavigationState,
} from "@/modules/erp-navigation";

import {
  ErpWorkspaceFrame,
} from "@/modules/erp-core";
import { ErpCalendarWorkspace } from "@/modules/erp-calendar";
import {
  FinanceFeature,
} from "@/modules/finance-erp/features/FinanceFeature";

type OrganizerErpPrototypeProps = {
  initialModule?: OrganizerModuleId;
  initialTab?: string;
  initialEventAction?: "create";
  initialEventId?: string;
  routeContent?: ReactNode;
};

export function OrganizerErpPrototype({
  initialModule: initialModuleProp,
  initialTab,
  initialEventAction,
  initialEventId,
  routeContent,
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
    initialTab,
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
      routeContent !== undefined &&
      activeModule.id === (initialModuleProp ?? "overview") &&
      (
        activeModule.id === "finance" ||
        !initialTab ||
        activeTab === initialTab
      )
    ) {
      return routeContent;
    }

    if (
      activeModule.id ===
      "overview"
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
      "calendar"
    ) {
      return (
        <ErpCalendarWorkspace
          role="organizer"
        />
      );
    }

    if (
      activeModule.id ===
      "finance"
    ) {
      return (
        <FinanceFeature
          role="organisateur"
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
            "fight-card"
          }
          onTabChange={
            setActiveTab
          }
        />
      );
    }

    if (
      activeModule.id ===
      "control-room"
    ) {
      return (
        <FightLiveListFeature
          mode="organizer"
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
            "organization"
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
