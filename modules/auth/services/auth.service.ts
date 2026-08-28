import { AuthRepository } from "../repositories";

export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  async login(email: string, password: string) {
    if (!email) throw new Error("Email obligatoire");
    if (!password) throw new Error("Mot de passe obligatoire");
    return this.repository.login(email, password);
  }

  async register(email: string, password: string, metadata?: Record<string, string>) {
    if (!email) throw new Error("Email obligatoire");
    if (password.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères");
    return this.repository.register(email, password, metadata);
  }

  logout() { return this.repository.logout(); }
  getSession() { return this.repository.getSession(); }
  getCurrentUser() { return this.repository.getCurrentUser(); }

  async requestPasswordReset(email: string, redirectTo: string) {
    if (!email) throw new Error("Email obligatoire");
    return this.repository.requestPasswordReset(email, redirectTo);
  }

  async resetPassword(password: string) {
    if (password.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères");
    return this.repository.resetPassword(password);
  }

  refreshSession() { return this.repository.refreshSession(); }
  completeCallback(code?: string | null) { return this.repository.completeCallback(code); }

  async resendVerification(email: string) {
    if (!email) throw new Error("Email obligatoire");
    return this.repository.resendVerification(email);
  }
}
