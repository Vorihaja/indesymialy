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
  const definition = universalRoleDefinitions.find((item) => item.id === role);
  if (!definition) throw new Error(`Configuration ERP introuvable : ${role}`);
  return definition;
}
