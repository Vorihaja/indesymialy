import type { AuthService } from "@/modules/auth/services";
import type { AuthSnapshot } from "@/modules/auth/session";
import { PrivateAccessRepository } from "./private-access.repository";
import type { PrivateAccessDecision, PrivateAccessKind } from "./types";

const ACTIVE_PROFILE_STATUS = "active";

export class PrivateAccessService {
  constructor(
    private readonly auth: AuthService,
    private readonly repository: PrivateAccessRepository,
  ) {}

  login(email: string, password: string) {
    return this.auth.login(email.trim().toLowerCase(), password);
  }

  snapshot() {
    return this.repository.snapshot();
  }

  authorize(snapshot: AuthSnapshot, kind: PrivateAccessKind): PrivateAccessDecision {
    const authenticated = Boolean(snapshot.user);
    const profileActive = snapshot.profile?.status === ACTIVE_PROFILE_STATUS;
    const hasAdminRole = snapshot.systemRoles.some((role) => role.code === "admin");
    const hasSuperAdminRole = snapshot.systemRoles.some((role) => role.code === "super_admin");
    const authorized = profileActive && (
      kind === "admin"
        ? hasAdminRole && !hasSuperAdminRole
        : hasSuperAdminRole
    );

    return { authenticated, authorized, profileActive };
  }

  logout() {
    return this.repository.logout();
  }

  mfaState() {
    return this.repository.mfaState();
  }

  enrollTotp() {
    return this.repository.enrollTotp();
  }

  async regenerateTotp(factorId: string) {
    await this.repository.abandonUnverifiedTotp(factorId);
    return await this.repository.enrollTotp();
  }

  verifyTotp(factorId: string, code: string) {
    return this.repository.verifyTotp(factorId, code);
  }

  verifyExistingTotp(code: string) {
    return this.repository.verifyExistingTotp(code);
  }

  recordAccess(action: string, details: Record<string, string | number | boolean | null>) {
    return this.repository.recordAccess(action, details);
  }
}
