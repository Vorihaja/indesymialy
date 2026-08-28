import {
  Activity, BarChart3, CalendarClock, CalendarDays, CircleGauge, Dumbbell, FileText, HeartPulse,
  Landmark, LockKeyhole, MessageSquare, Radio, Settings, ShieldCheck, ShoppingBag,
  TicketCheck, Users, WalletCards,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ErpModuleSidebar } from '@/modules/erp-core';
import { useCollapsibleSidebar } from '@/modules/erp-core/hooks/use-collapsible-sidebar';
import type { UniversalIconKey, UniversalRoleDefinition } from '../types';

const icons: Record<UniversalIconKey, LucideIcon> = {
  overview: CircleGauge,
  users: Users,
  organizations: Landmark,
  events: CalendarDays,
  sport: ShieldCheck,
  finance: WalletCards,
  security: LockKeyhole,
  documents: FileText,
  communication: MessageSquare,
  performance: BarChart3,
  settings: Settings,
  live: Radio,
  training: Dumbbell,
  medical: HeartPulse,
  commerce: ShoppingBag,
  contracts: Activity,
  tickets: TicketCheck,
  calendar: CalendarClock,
};

export function UniversalSidebar({ definition, active, onChange }: {
  definition: UniversalRoleDefinition;
  active: string;
  onChange: (id: string) => void;
}) {
  const { collapsed, toggle } = useCollapsibleSidebar();

  const items = definition.modules.map((module) => ({
    id: module.id,
    label: module.label,
    icon: icons[module.icon],
    live: module.live,
  }));

  return (
    <ErpModuleSidebar
      workspaceLabel={definition.label}
      items={items}
      active={active}
      onChange={onChange}
      navigationLabel={`Navigation ${definition.label}`}
      mobileNavigationLabel={`Navigation ${definition.label} mobile`}
      collapsed={collapsed}
      onToggleCollapsed={toggle}
    />
  );
}
