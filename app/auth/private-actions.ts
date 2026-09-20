"use server";

import { createPrivateAccessUseCase } from "@/modules/auth/private-access/private-access.factory";
import {
  sanitizePrivateDestination,
} from "@/modules/auth/private-access/policy";
import {
  getOrCreateTotpEnrollment,
  mfaFailureLogDetails,
  normalizeTotpCode,
  safeMfaErrorCode,
  type TotpEnrollment,
} from "@/modules/auth/private-access/mfa-flow";
import type {
  PrivateAccessKind,
  PrivateAccessDecision,
  PrivateLoginState,
  PrivateMfaActionState,
} from "@/modules/auth/private-access/types";

const GENERIC_LOGIN_ERROR = "Connexion impossible. Vérifiez vos identifiants et réessayez.";
const GENERIC_ACCESS_ERROR = "Ce compte ne peut pas accéder à cet espace privé.";
const GENERIC_MFA_ERROR = "La vérification renforcée a échoué. Réessayez avec un nouveau code.";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function loginPrivate(
  kind: PrivateAccessKind,
  _previous: PrivateLoginState,
  formData: FormData,
): Promise<PrivateLoginState> {
  const email = formString(formData, "email");
  const password = formValue(formData, "password");
  const destination = sanitizePrivateDestination(kind, formString(formData, "next"));

  if (!email || !password || !email.includes("@")) {
    return { status: "error", message: GENERIC_LOGIN_ERROR, destination: null, hasSession: false };
  }

  const useCase = await createPrivateAccessUseCase();
  let decision: PrivateAccessDecision;
  try {
    ({ decision } = await useCase.login(kind, email, password));
  } catch {
    return { status: "error", message: GENERIC_LOGIN_ERROR, destination: null, hasSession: false };
  }

  if (!decision.authorized) {
    return { status: "unauthorized", message: GENERIC_ACCESS_ERROR, destination: null, hasSession: true };
  }

  try {
    await useCase.log(
      kind === "admin" ? "ADMIN_PRIVATE_AUTH_SUCCESS" : "SUPER_ADMIN_PRIVATE_AUTH_SUCCESS",
      { destination, source: "private_auth_action" },
    );

    if (kind === "admin") {
      return { status: "success", message: null, destination, hasSession: true };
    }

    const mfa = await useCase.mfaState();
    const nextDestination = mfa.currentLevel === "aal2"
      ? destination
      : `${mfa.verifiedTotpFactorId ? "/auth/vh-teck/mfa" : "/auth/vh-teck/mfa/enroll"}?next=${encodeURIComponent(destination)}`;

    return { status: "success", message: null, destination: nextDestination, hasSession: true };
  } catch {
    return {
      status: "unauthorized",
      message: "La vérification renforcée n’est pas disponible. Vérifiez la configuration Supabase ou changez de compte.",
      destination: null,
      hasSession: true,
    };
  }
}

export async function loginAdmin(
  previous: PrivateLoginState,
  formData: FormData,
): Promise<PrivateLoginState> {
  return await loginPrivate("admin", previous, formData);
}

export async function loginSuperAdmin(
  previous: PrivateLoginState,
  formData: FormData,
): Promise<PrivateLoginState> {
  return await loginPrivate("super_admin", previous, formData);
}

export async function changePrivateAccount(): Promise<void> {
  const useCase = await createPrivateAccessUseCase();
  await useCase.logout();
}

export async function enrollSuperAdminMfa(
  previous: PrivateMfaActionState,
  formData: FormData,
): Promise<PrivateMfaActionState> {
  let useCase: Awaited<ReturnType<typeof createPrivateAccessUseCase>> | null = null;
  try {
    useCase = await createPrivateAccessUseCase();
    const { decision } = await useCase.current("super_admin");
    if (!decision.authorized) {
      return { status: "error", message: GENERIC_ACCESS_ERROR, destination: null, factorId: null, qrCode: null, secret: null, errorCode: "unexpected_failure" };
    }

    const intent = formString(formData, "intent");
    const currentEnrollment: TotpEnrollment | null = previous.status === "ready"
      && previous.factorId
      && previous.qrCode
      && previous.secret
      ? {
          factorId: previous.factorId,
          qrCode: previous.qrCode,
          secret: previous.secret,
        }
      : null;

    if (intent !== "regenerate" && currentEnrollment) {
      return { ...previous, errorCode: null };
    }

    const currentFactorId = formString(formData, "factorId");
    if (intent === "regenerate" && (
      !currentEnrollment || currentEnrollment.factorId !== currentFactorId
    )) {
      return { status: "error", message: GENERIC_MFA_ERROR, destination: null, factorId: null, qrCode: null, secret: null, errorCode: "mfa_factor_not_found" };
    }

    const enrolled = intent === "regenerate"
      ? await useCase.regenerateTotp(currentFactorId)
      : await getOrCreateTotpEnrollment(currentEnrollment, () => useCase!.enrollTotp());
    await useCase.log("SUPER_ADMIN_MFA_ENROLLMENT_STARTED", { source: "private_auth_action" });
    return {
      status: "ready",
      message: null,
      destination: null,
      factorId: enrolled.factorId,
      qrCode: enrolled.qrCode,
      secret: enrolled.secret,
      errorCode: null,
    };
  } catch (error) {
    const errorCode = safeMfaErrorCode(error);
    if (useCase) {
      await useCase.log(
        "SUPER_ADMIN_MFA_ENROLLMENT_FAILURE",
        mfaFailureLogDetails(errorCode, "private_auth_action"),
      );
    }
    return {
      status: "error",
      message: "L’enrôlement MFA Supabase n’est pas disponible. Vérifiez la configuration distante.",
      destination: null,
      factorId: null,
      qrCode: null,
      secret: null,
      errorCode,
    };
  }
}

export async function verifySuperAdminMfaEnrollment(
  _previous: PrivateMfaActionState,
  formData: FormData,
): Promise<PrivateMfaActionState> {
  const code = normalizeTotpCode(formData.get("code"));
  const factorId = formString(formData, "factorId");
  const destination = sanitizePrivateDestination("super_admin", formString(formData, "next"));

  if (!/^\d{6}$/.test(code) || !factorId) {
    return { status: "error", message: GENERIC_MFA_ERROR, destination: null, factorId, qrCode: null, secret: null, errorCode: "mfa_verification_failed" };
  }

  const useCase = await createPrivateAccessUseCase();
  try {
    const { decision } = await useCase.current("super_admin");
    if (!decision.authorized) {
      return { status: "error", message: GENERIC_ACCESS_ERROR, destination: null, factorId, qrCode: null, secret: null, errorCode: "unexpected_failure" };
    }
    await useCase.verifyTotp(factorId, code);
    const mfa = await useCase.mfaState();
    if (mfa.currentLevel !== "aal2") {
      return { status: "error", message: GENERIC_MFA_ERROR, destination: null, factorId, qrCode: null, secret: null, errorCode: "mfa_verification_failed" };
    }
    await useCase.log("SUPER_ADMIN_MFA_SUCCESS", { destination, source: "mfa_enrollment" });
    return { status: "success", message: null, destination, factorId: null, qrCode: null, secret: null, errorCode: null };
  } catch (error) {
    const errorCode = safeMfaErrorCode(error);
    await useCase.log(
      "SUPER_ADMIN_MFA_FAILURE",
      mfaFailureLogDetails(errorCode, "mfa_enrollment"),
    );
    return { status: "error", message: GENERIC_MFA_ERROR, destination: null, factorId, qrCode: null, secret: null, errorCode };
  }
}

export async function challengeSuperAdminMfa(
  _previous: PrivateMfaActionState,
  formData: FormData,
): Promise<PrivateMfaActionState> {
  const code = normalizeTotpCode(formData.get("code"));
  const destination = sanitizePrivateDestination("super_admin", formString(formData, "next"));
  const useCase = await createPrivateAccessUseCase();

  if (!/^\d{6}$/.test(code)) {
    return { status: "error", message: GENERIC_MFA_ERROR, destination: null, factorId: null, qrCode: null, secret: null, errorCode: "mfa_verification_failed" };
  }

  try {
    const { decision } = await useCase.current("super_admin");
    if (!decision.authorized) {
      return { status: "error", message: GENERIC_ACCESS_ERROR, destination: null, factorId: null, qrCode: null, secret: null, errorCode: "unexpected_failure" };
    }
    await useCase.verifyExistingTotp(code);
    const mfa = await useCase.mfaState();
    if (mfa.currentLevel !== "aal2") {
      return { status: "error", message: GENERIC_MFA_ERROR, destination: null, factorId: null, qrCode: null, secret: null, errorCode: "mfa_verification_failed" };
    }
    await useCase.log("SUPER_ADMIN_MFA_SUCCESS", { destination, source: "mfa_challenge" });
    return { status: "success", message: null, destination, factorId: null, qrCode: null, secret: null, errorCode: null };
  } catch (error) {
    const errorCode = safeMfaErrorCode(error);
    await useCase.log(
      "SUPER_ADMIN_MFA_FAILURE",
      mfaFailureLogDetails(errorCode, "mfa_challenge"),
    );
    return { status: "error", message: GENERIC_MFA_ERROR, destination: null, factorId: null, qrCode: null, secret: null, errorCode };
  }
}
