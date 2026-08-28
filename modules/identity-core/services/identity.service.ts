import type { AuthService } from "@/modules/auth/services";
import type { IdentityRepository, RegistrationProfile } from "../repositories/identity.repository";
import { normalizeIdentityError } from "../errors";
import type { AccountPreferences, IdentityOrganization, IdentityRole, OnboardingDraft, PrivateProfile } from "../types";
import { isControlledIdentityRole, isFlexibleIdentityRole, isPublicIdentityRole } from "../role-policy";

export class IdentityService {
  constructor(private readonly repository: IdentityRepository, private readonly auth: AuthService) {}
  snapshot() { return this.repository.snapshot(); }

  async login(email: string, password: string) {
    try {
      await this.auth.login(email, password);
      const outcome = await this.repository.completePendingRegistration();
      if (outcome?.kind === "pending") return "/role-requests";
      return "/dashboard";
    } catch (reason) { throw normalizeIdentityError(reason); }
  }

  async register(input: RegistrationProfile & { password: string; confirmation: string; accepted: boolean }) {
    const { fullName, email, password, confirmation, accepted, role, regionId, cityId } = input;
    if (!fullName.trim() || !email.trim() || password.length < 8 || password !== confirmation || !accepted || !role || !regionId || !cityId) {
      throw normalizeIdentityError(new Error("VALIDATION_ERROR"));
    }
    try {
      if (!isPublicIdentityRole(role)) throw new Error("ACCESS_DENIED");
      const registrationRole = isControlledIdentityRole(role) ? "fan" : role;
      const result = await this.auth.register(email, password, {
        full_name: fullName.trim(),
        primary_role: registrationRole,
        requested_role: isControlledIdentityRole(role) ? role : "",
        region_id: regionId,
        city_id: cityId,
        profile_setup_pending: "true",
      });
      if (result?.session) {
        const outcome = await this.repository.completeRegistration({
          fullName: fullName.trim(), email, role, regionId, cityId,
        });
        return outcome.kind === "pending" ? "/role-requests" : "/dashboard";
      }
      return "/auth/verify";
    } catch (reason) { throw normalizeIdentityError(reason); }
  }

  logout() { return this.auth.logout(); }
  async forgotPassword(email: string, redirectTo: string) { if (!email.trim()) throw normalizeIdentityError(new Error("VALIDATION_ERROR")); try { await this.auth.requestPasswordReset(email, redirectTo); } catch (reason) { throw normalizeIdentityError(reason); } }
  async resetPassword(password: string, confirmation: string) { if (password.length < 8 || password !== confirmation) throw normalizeIdentityError(new Error("VALIDATION_ERROR")); try { await this.auth.resetPassword(password); } catch (reason) { throw normalizeIdentityError(reason); } }
  async refreshSession() {
    try {
      const session = await this.auth.refreshSession();
      const outcome = session ? await this.repository.completePendingRegistration() : null;
      return {
        session,
        destination: outcome?.kind === "pending" ? "/role-requests" : null,
      };
    } catch (reason) {
      throw normalizeIdentityError(reason);
    }
  }
  async resumeRegistration() {
    try {
      return await this.repository.completePendingRegistration();
    } catch (reason) {
      throw normalizeIdentityError(reason);
    }
  }
  async completeCallback(code?: string | null) { try { await this.auth.completeCallback(code); const outcome = await this.repository.completePendingRegistration(); return outcome?.kind === "pending" ? "/role-requests" : null; } catch (reason) { throw normalizeIdentityError(reason); } }
  async resendVerification(email: string) { try { await this.auth.resendVerification(email); } catch (reason) { throw normalizeIdentityError(reason); } }
  saveDraft(value: OnboardingDraft) { return this.repository.saveDraft(value); }
  complete() { return this.repository.completeOnboarding(); }
  updateProfile(patch: Partial<PrivateProfile>) { return this.repository.updateProfile(patch); }
  async roleRequest(role: IdentityRole, reason: string, justificationsPrepared: string[]) {
    if (!isPublicIdentityRole(role)) throw normalizeIdentityError(new Error("ACCESS_DENIED"));
    try {
      if (isFlexibleIdentityRole(role)) return await this.repository.assignFlexibleRole(role);
      await this.repository.createRoleRequest({ role, reason, justificationsPrepared });
      return { kind: "pending" as const, role };
    } catch (error) {
      throw normalizeIdentityError(error);
    }
  }
  organization(input: Omit<IdentityOrganization, "id" | "ownerId" | "members" | "status">) { return this.repository.createOrganization(input); }
  updateOrganization(id: string, patch: Partial<Pick<IdentityOrganization, "name" | "description" | "regionId" | "cityId" | "email" | "phone" | "website" | "disciplines">>) { return this.repository.updateOrganization(id, patch); }
  activateOrganization(id: string) { return this.repository.setActiveOrganization(id); }
  savePreferences(value: AccountPreferences) { return this.repository.savePreferences(value); }
}
