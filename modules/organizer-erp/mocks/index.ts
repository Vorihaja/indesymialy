import type { OrganizerModuleId, OrganizerModuleMock } from '../types';
import { eventsMock } from './events.mock';
import { fightCenterMock } from './fight-center.mock';
import { ticketingMock } from './ticketing.mock';
import { teamMock } from './team.mock';
import { operationsMock } from './operations.mock';
import { partnersMock } from './partners.mock';
import { financeMock } from './finance.mock';
import { performanceMock } from './performance.mock';
import { settingsMock } from './settings.mock';
import { getOrganizerTabWorkflowMock } from './tab-workflows.mock';

export const moduleMocks: Partial<Record<OrganizerModuleId, OrganizerModuleMock>> = {
  events: eventsMock, 'fight-center': fightCenterMock, ticketing: ticketingMock, team: teamMock,
  operations: operationsMock, partners: partnersMock, finance: financeMock, performance: performanceMock, settings: settingsMock,
};

export function getOrganizerModuleMock(moduleId: OrganizerModuleId, tab: string) {
  const base = moduleMocks[moduleId];
  return base ? getOrganizerTabWorkflowMock(moduleId, tab, base) : undefined;
}
