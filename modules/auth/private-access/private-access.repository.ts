import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/infrastructure/supabase/database.types";
import { loadAuthSnapshot, type AuthSnapshot } from "@/modules/auth/session";
import {
  challengeThenVerifyTotp,
  enrollTotpOnce,
  isCurrentUnverifiedTotpFactor,
  MfaFlowError,
} from "./mfa-flow";
import type { PrivateMfaState } from "./types";

function assuranceLevel(value: string | null): "aal1" | "aal2" | null {
  if (value === "aal1") return "aal1";
  if (value === "aal2") return "aal2";
  return null;
}

export class PrivateAccessRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  snapshot(): Promise<AuthSnapshot> {
    return loadAuthSnapshot(this.supabase);
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async mfaState(): Promise<PrivateMfaState> {
    const [assuranceResult, factorsResult] = await Promise.all([
      this.supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      this.supabase.auth.mfa.listFactors(),
    ]);

    if (assuranceResult.error) throw assuranceResult.error;
    if (factorsResult.error) throw factorsResult.error;

    const verifiedTotp = factorsResult.data.totp.find(
      (factor) => factor.status === "verified",
    );

    return {
      currentLevel: assuranceLevel(assuranceResult.data.currentLevel),
      nextLevel: assuranceLevel(assuranceResult.data.nextLevel),
      verifiedTotpFactorId: verifiedTotp?.id ?? null,
    };
  }

  async enrollTotp(): Promise<{
    factorId: string;
    qrCode: string;
    secret: string;
  }> {
    return await enrollTotpOnce(() => this.supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Indesy Control Center",
    }));
  }

  async abandonUnverifiedTotp(factorId: string): Promise<void> {
    const factorsResult = await this.supabase.auth.mfa.listFactors();
    if (factorsResult.error) throw factorsResult.error;

    const factor = factorsResult.data.all.find(
      (candidate) => isCurrentUnverifiedTotpFactor(candidate, factorId),
    );
    if (!factor) throw new MfaFlowError("mfa_factor_not_found");

    const { error } = await this.supabase.auth.mfa.unenroll({ factorId });
    if (error) throw error;
  }

  async verifyTotp(factorId: string, code: string): Promise<void> {
    await challengeThenVerifyTotp(
      factorId,
      code,
      async (currentFactorId) => await this.supabase.auth.mfa.challenge({
        factorId: currentFactorId,
      }),
      async (params) => await this.supabase.auth.mfa.verify(params),
    );
  }

  async verifyExistingTotp(code: string): Promise<void> {
    const state = await this.mfaState();
    if (!state.verifiedTotpFactorId) throw new MfaFlowError("mfa_factor_not_found");
    await this.verifyTotp(state.verifiedTotpFactorId, code);
  }

  async recordAccess(action: string, details: Record<string, Json>): Promise<boolean> {
    const { error } = await this.supabase.rpc("record_admin_access", {
      p_action: action,
      p_details: details,
    });
    return !error;
  }
}
