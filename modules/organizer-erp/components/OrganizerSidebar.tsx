import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  CircleGauge,
  Handshake,
  Radio,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Swords,
  TicketCheck,
  UserRoundCog,
  Users,
  WalletCards,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

import {
  organizerModules,
} from "../config/navigation";

import {
  getOrganizerModuleDisplayLabel,
} from "../config/display-labels";

import type {
  OrganizerModuleId,
} from "../types";

import {
  ErpModuleSidebar,
} from "@/modules/erp-core";

import type {
  ErpModuleNavigationItem,
} from "@/modules/erp-core";

const icons: Record<
  OrganizerModuleId,
  LucideIcon
> = {
  overview: CircleGauge,
  events: CalendarDays,
  "fight-center": Swords,
  ticketing: TicketCheck,
  team: Users,
  operations: ShieldCheck,
  partners: Handshake,
  finance: WalletCards,
  performance: BarChart3,
  calendar: CalendarClock,
  marketplace: ShoppingBag,
  personnel: UserRoundCog,
  settings: Settings,
  "control-room": Radio,
};

const navigationItems: readonly ErpModuleNavigationItem<OrganizerModuleId>[] =
  organizerModules.map((entry) => ({
    id: entry.id,
    label: getOrganizerModuleDisplayLabel(
      entry.id,
      entry.label,
    ),
    icon: icons[entry.id],
    live: entry.live,
  }));

export function OrganizerSidebar({
  active,
  onChange,
}: {
  active: OrganizerModuleId;
  onChange: (
    id: OrganizerModuleId,
  ) => void;
}) {
  return (
    <ErpModuleSidebar
      workspaceLabel="Organisateur"
      items={navigationItems}
      active={active}
      onChange={onChange}
      navigationLabel="Navigation Organisateur"
      mobileNavigationLabel="Navigation Organisateur mobile"
    />
  );
}
