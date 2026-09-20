import type { UniversalRoleDefinition, UniversalRoleId } from '../types';
import { platformRoleDefinitions } from './platform-roles';
import { sportGovernanceRoleDefinitions } from './sport-governance-roles';
import { sportProfessionalRoleDefinitions } from './sport-professional-roles';
import { ecosystemRoleDefinitions } from './ecosystem-roles';

export const universalRoleDefinitions: UniversalRoleDefinition[] = [
  ...platformRoleDefinitions,
  ...sportGovernanceRoleDefinitions,
  ...sportProfessionalRoleDefinitions,
  ...ecosystemRoleDefinitions,
];

export function getUniversalRoleDefinition(role: UniversalRoleId) {
  if (role === 'official') {
    const refereeDefinition = universalRoleDefinitions.find(
      (item) => item.id === 'referee',
    );

    if (!refereeDefinition) {
      throw new Error('Configuration ERP de compatibilité introuvable : referee');
    }

    return {
      ...refereeDefinition,
      id: 'official' as const,
      label: 'Officiel',
      guardRole: 'official',
      workspaceStatus: 'Officiel disponible',
      modules: refereeDefinition.modules.map((module) =>
        module.id === 'availability'
          ? { ...module, tabs: [] }
          : module,
      ),
    };
  }

  const definition = universalRoleDefinitions.find((item) => item.id === role);
  if (!definition) throw new Error(`Configuration ERP introuvable : ${role}`);
  return definition;
}
