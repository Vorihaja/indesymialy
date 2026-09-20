import { PrivateAccessService } from "./private-access.service";
import type { PrivateAccessKind } from "./types";

export class PrivateAccessUseCase {
  constructor(private readonly service: PrivateAccessService) {}

  async current(kind: PrivateAccessKind) {
    const snapshot = await this.service.snapshot();
    return {
      snapshot,
      decision: this.service.authorize(snapshot, kind),
    };
  }

  async login(kind: PrivateAccessKind, email: string, password: string) {
    await this.service.login(email, password);
    const result = await this.current(kind);
    await this.log(
      result.decision.authorized
        ? kind === "admin" ? "ADMIN_AUTH_SUCCESS" : "SUPER_ADMIN_AUTH_SUCCESS"
        : "PRIVATE_AUTH_ROLE_DENIED",
      { kind, source: "private_auth" },
    );
    return result;
  }

  logout() {
    return this.service.logout();
  }

  mfaState() {
    return this.service.mfaState();
  }

  enrollTotp() {
    return this.service.enrollTotp();
  }

  regenerateTotp(factorId: string) {
    return this.service.regenerateTotp(factorId);
  }

  verifyTotp(factorId: string, code: string) {
    return this.service.verifyTotp(factorId, code);
  }

  verifyExistingTotp(code: string) {
    return this.service.verifyExistingTotp(code);
  }

  async log(action: string, details: Record<string, string | number | boolean | null>) {
    const recorded = await this.service.recordAccess(action, details);
    if (!recorded) {
      console.warn("[PrivateAccess]", {
        action,
        details,
        occurredAt: new Date().toISOString(),
      });
    }
    return recorded;
  }
}
