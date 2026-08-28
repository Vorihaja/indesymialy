import type { IdentityService } from "../services/identity.service";
import type { RegistrationProfile } from "../repositories/identity.repository";
import type { AccountPreferences, IdentityOrganization, IdentityRole, OnboardingDraft, PrivateProfile } from "../types";
export class ManageIdentityUseCase {
  constructor(private readonly service: IdentityService) {}
  execute() { return this.service.snapshot(); }
  login(email: string, password: string) { return this.service.login(email, password); }
  register(input: RegistrationProfile & { password: string; confirmation: string; accepted: boolean }) { return this.service.register(input); }
  logout() { return this.service.logout(); }
  forgotPassword(email: string, redirectTo: string) { return this.service.forgotPassword(email, redirectTo); }
  resetPassword(password: string, confirmation: string) { return this.service.resetPassword(password, confirmation); }
  refreshSession() { return this.service.refreshSession(); }
  resumeRegistration() { return this.service.resumeRegistration(); }
  completeCallback(code?: string | null) { return this.service.completeCallback(code); }
  resendVerification(email: string) { return this.service.resendVerification(email); }
  saveDraft(value: OnboardingDraft) { return this.service.saveDraft(value); }
  complete() { return this.service.complete(); }
  updateProfile(patch: Partial<PrivateProfile>) { return this.service.updateProfile(patch); }
  requestRole(role: IdentityRole, reason: string, files: string[]) { return this.service.roleRequest(role, reason, files); }
  createOrganization(input: Omit<IdentityOrganization, "id" | "ownerId" | "members" | "status">) { return this.service.organization(input); }
  updateOrganization(id: string, patch: Partial<Pick<IdentityOrganization, "name" | "description" | "regionId" | "cityId" | "email" | "phone" | "website" | "disciplines">>) { return this.service.updateOrganization(id, patch); }
  activateOrganization(id: string) { return this.service.activateOrganization(id); }
  savePreferences(value: AccountPreferences) { return this.service.savePreferences(value); }
}
