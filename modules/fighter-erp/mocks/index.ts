import type { OrganizerModuleMock } from '@/modules/organizer-erp/types';
import type { FighterModuleId } from '../types';
import { profileCareerMock } from './profile-career.mock';
import { trainingPreparationMock } from './training-preparation.mock';
import { competitionsHealthMock } from './competitions-health.mock';
import { teamBusinessMock } from './team-business.mock';
import { performanceSettingsMock } from './performance-settings.mock';
import { fighterMock, genericSeed } from './helpers';

export function getFighterModuleMock(module: FighterModuleId, tab: string): OrganizerModuleMock {
  if (module === 'profile' || module === 'career') return profileCareerMock(module, tab);
  if (module === 'training' || module === 'fight-preparation') return trainingPreparationMock(module, tab);
  if (module === 'competitions' || module === 'health') return competitionsHealthMock(module, tab);
  if (module === 'team' || module === 'finance' || module === 'sponsors') return teamBusinessMock(module, tab);
  if (module === 'performance' || module === 'settings') return performanceSettingsMock(module, tab);
  return fighterMock('ERP Combattant', tab || 'Données', genericSeed);
}
