import {
  Activity, BadgeDollarSign, BarChart3, CalendarCheck, CalendarClock, CircleGauge, Dumbbell,
  HeartPulse, Radio, Settings, ShieldCheck, ShoppingBag, Sparkles, Target, UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  ErpModuleSidebar,
} from '@/modules/erp-core';
import type {
  ErpModuleNavigationItem,
} from '@/modules/erp-core';
import { fighterModules } from '../config/navigation';
import type { FighterModuleId } from '../types';

const icons: Record<FighterModuleId, LucideIcon> = {
  overview: CircleGauge,
  profile: UserRound,
  career: Sparkles,
  training: Dumbbell,
  'fight-preparation': Target,
  competitions: CalendarCheck,
  health: HeartPulse,
  team: ShieldCheck,
  finance: BadgeDollarSign,
  sponsors: Activity,
  performance: BarChart3,
  calendar: CalendarClock,
  marketplace: ShoppingBag,
  settings: Settings,
  'fight-room': Radio,
};

const navigationItems: readonly ErpModuleNavigationItem<FighterModuleId>[] =
  fighterModules.map((entry) => ({
    id: entry.id,
    label: entry.label,
    icon: icons[entry.id],
    live: entry.live,
  }));

export function FighterSidebar({ active, onChange }: {
  active: FighterModuleId;
  onChange: (id: FighterModuleId) => void;
}) {
  return (
    <ErpModuleSidebar
      workspaceLabel="Combattant"
      items={navigationItems}
      active={active}
      onChange={onChange}
      navigationLabel="Navigation Combattant"
      mobileNavigationLabel="Navigation Combattant mobile"
    />
  );
}
