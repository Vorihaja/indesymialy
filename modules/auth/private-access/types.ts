import type { MfaSafeErrorCode } from "./mfa-flow";

export type PrivateAccessKind = "admin" | "super_admin";

export type PrivateAccessDecision = {
  authenticated: boolean;
  authorized: boolean;
  profileActive: boolean;
};

export type PrivateMfaState = {
  currentLevel: "aal1" | "aal2" | null;
  nextLevel: "aal1" | "aal2" | null;
  verifiedTotpFactorId: string | null;
};

export type PrivateLoginState = {
  status: "idle" | "error" | "unauthorized" | "success";
  message: string | null;
  destination: string | null;
  hasSession: boolean;
};

export type PrivateMfaActionState = {
  status: "idle" | "error" | "ready" | "success";
  message: string | null;
  destination: string | null;
  factorId: string | null;
  qrCode: string | null;
  secret: string | null;
  errorCode: MfaSafeErrorCode | null;
};

export const INITIAL_PRIVATE_LOGIN_STATE: PrivateLoginState = {
  status: "idle",
  message: null,
  destination: null,
  hasSession: false,
};

export const INITIAL_PRIVATE_MFA_STATE: PrivateMfaActionState = {
  status: "idle",
  message: null,
  destination: null,
  factorId: null,
  qrCode: null,
  secret: null,
  errorCode: null,
};
