export const MFA_SAFE_ERROR_CODES = [
  "mfa_verification_failed",
  "mfa_challenge_expired",
  "mfa_factor_not_found",
  "mfa_ip_address_mismatch",
  "mfa_totp_verify_not_enabled",
  "over_request_rate_limit",
  "unexpected_failure",
] as const;

export type MfaSafeErrorCode = (typeof MFA_SAFE_ERROR_CODES)[number];

export type TotpEnrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

type MfaResult<T> = {
  data: T | null;
  error: unknown | null;
};

export class MfaFlowError extends Error {
  readonly code: MfaSafeErrorCode;

  constructor(code: MfaSafeErrorCode) {
    super(code);
    this.name = "MfaFlowError";
    this.code = code;
  }
}

export function safeMfaErrorCode(error: unknown): MfaSafeErrorCode {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return "unexpected_failure";
  }

  const code = error.code;
  return typeof code === "string" && MFA_SAFE_ERROR_CODES.includes(code as MfaSafeErrorCode)
    ? code as MfaSafeErrorCode
    : "unexpected_failure";
}

export function normalizeTotpCode(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s/g, "") : "";
}

export function claimSubmission(lock: { current: boolean }): boolean {
  if (lock.current) return false;
  lock.current = true;
  return true;
}

export function mfaFailureLogDetails(errorCode: MfaSafeErrorCode, source: string) {
  return { errorCode, source };
}

export function isCurrentUnverifiedTotpFactor(
  factor: { id: string; factor_type: string; status: string },
  factorId: string,
): boolean {
  return factor.id === factorId
    && factor.factor_type === "totp"
    && factor.status === "unverified";
}

export async function getOrCreateTotpEnrollment(
  current: TotpEnrollment | null,
  enroll: () => Promise<TotpEnrollment>,
): Promise<TotpEnrollment> {
  return current ?? await enroll();
}

export async function enrollTotpOnce(
  enroll: () => Promise<MfaResult<{
    id: string;
    totp: { qr_code: string; secret: string };
  }>>,
): Promise<TotpEnrollment> {
  const { data, error } = await enroll();
  if (error) throw error;
  if (!data) throw new MfaFlowError("unexpected_failure");

  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

export async function challengeThenVerifyTotp(
  factorId: string,
  code: string,
  challenge: (factorId: string) => Promise<MfaResult<{ id: string }>>,
  verify: (params: {
    factorId: string;
    challengeId: string;
    code: string;
  }) => Promise<MfaResult<unknown>>,
): Promise<void> {
  const challengeResult = await challenge(factorId);
  if (challengeResult.error) throw challengeResult.error;
  if (!challengeResult.data) throw new MfaFlowError("unexpected_failure");

  const verifyResult = await verify({
    factorId,
    challengeId: challengeResult.data.id,
    code,
  });
  if (verifyResult.error) throw verifyResult.error;
}
