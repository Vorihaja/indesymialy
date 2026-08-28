import type { AccountPreferences, IdentityOrganization, IdentityRole, IdentityRoleRequest, IdentitySnapshot, OnboardingDraft, PrivateProfile, RoleAssignmentOutcome } from "../types";
export type RegistrationProfile = { fullName: string; email: string; role: IdentityRole; regionId: string; cityId: string };
export interface IdentityRepository {
  snapshot(): Promise<IdentitySnapshot>;
  completeRegistration(input: RegistrationProfile): Promise<RoleAssignmentOutcome>;
  completePendingRegistration(): Promise<RoleAssignmentOutcome | null>;
  saveDraft(draft: OnboardingDraft): Promise<OnboardingDraft>;
  completeOnboarding(): Promise<PrivateProfile>;
  updateProfile(patch: Partial<PrivateProfile>): Promise<PrivateProfile>;
  createRoleRequest(input: Pick<IdentityRoleRequest, "role" | "reason" | "justificationsPrepared">): Promise<IdentityRoleRequest>;
  assignFlexibleRole(role: IdentityRole, options?: { makePrimary?: boolean }): Promise<RoleAssignmentOutcome>;
  createOrganization(input: Omit<IdentityOrganization, "id" | "ownerId" | "members" | "status">): Promise<IdentityOrganization>;
  updateOrganization(id: string, patch: Partial<Pick<IdentityOrganization, "name" | "description" | "regionId" | "cityId" | "email" | "phone" | "website" | "disciplines">>): Promise<IdentityOrganization>;
  setActiveOrganization(id: string): Promise<void>;
  savePreferences(value: AccountPreferences): Promise<AccountPreferences>;
}
