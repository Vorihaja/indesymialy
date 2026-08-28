import { BackendError } from "@/shared/errors/backend-error";
import { IdentityError } from "./types";

type IdentityErrorLike = {
  code?: unknown;
  message?: unknown;
  details?: unknown;
  hint?: unknown;
  error_description?: unknown;
};

function identityErrorFingerprint(reason: unknown) {
  const source = reason as IdentityErrorLike | null;
  const values = [
    reason instanceof Error ? reason.message : null,
    source?.message,
    source?.error_description,
    source?.details,
    source?.hint,
    source?.code,
  ];
  return values
    .filter((value): value is string => typeof value === "string" && value.trim() !== "" && value.trim() !== "{}")
    .join(" ")
    .toLowerCase();
}

function normalizeBackendIdentityError(reason: BackendError): IdentityError {
  switch (reason.code) {
    case "UNAUTHENTICATED":
      return new IdentityError("SESSION_EXPIRED", "Votre session a expiré. Veuillez vous reconnecter.");
    case "FORBIDDEN":
      return new IdentityError("ACCESS_DENIED", reason.message);
    case "NOT_FOUND":
    case "VALIDATION_ERROR":
    case "FOREIGN_KEY_ERROR":
    case "UNIQUE_CONSTRAINT_ERROR":
      return new IdentityError("VALIDATION_ERROR", reason.message);
    case "NETWORK_ERROR":
      return new IdentityError("NETWORK_ERROR", reason.message);
    case "STORAGE_NOT_IMPLEMENTED":
      return new IdentityError("UNKNOWN_ERROR", reason.message);
    case "UNKNOWN_ERROR":
      return new IdentityError("UNKNOWN_ERROR", "Une erreur inattendue est survenue.");
  }
}

export function normalizeIdentityError(reason: unknown): IdentityError {
  if (reason instanceof IdentityError) return reason;
  if (reason instanceof BackendError) return normalizeBackendIdentityError(reason);

  const message = identityErrorFingerprint(reason);

  if (message.includes("primary_role_id") || message.includes("registration_primary_role")) {
    return new IdentityError(
      "UNKNOWN_ERROR",
      "La migration du rôle principal n’est pas encore appliquée dans Supabase.",
    );
  }

  if (message.includes("already registered") || message.includes("already exists") || message.includes("user_already_exists") || message.includes("email already")) {
    return new IdentityError("ALREADY_REGISTERED", "Cet email est déjà associé à un compte. Veuillez vous connecter.");
  }
  if (message.includes("invalid login credentials") || message.includes("invalid_credentials") || message.includes("invalid credential") || message.includes("wrong password")) {
    return new IdentityError("INVALID_CREDENTIALS", "Email ou mot de passe incorrect.");
  }
  if (message.includes("password should be at least") || message.includes("password_too_short")) {
    return new IdentityError("WEAK_PASSWORD", "Le mot de passe doit contenir au moins 6 caractères.");
  }
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return new IdentityError("RATE_LIMIT", "Trop de tentatives. Veuillez reessayer dans quelques instants.");
  }
  if (
    message.includes("access_denied") ||
    message.includes("forbidden") ||
    message.includes("permission denied") ||
    message.includes("row-level security") ||
    message.includes("42501")
  ) {
    return new IdentityError("ACCESS_DENIED", "Cette élévation de privilège est interdite.");
  }
  if (message.includes("suspended")) {
    return new IdentityError("ACCOUNT_SUSPENDED", "Ce compte est suspendu. Veuillez contacter le support.");
  }
  if (message.includes("validation") || message.includes("obligatoire") || message.includes("required")) {
    return new IdentityError("VALIDATION_ERROR", "Vérifiez les informations saisies.");
  }
  if (message.includes("confirm") || message.includes("verified") || message.includes("email not confirmed")) {
    return new IdentityError("EMAIL_NOT_VERIFIED", "Veuillez vérifier votre adresse email pour continuer.");
  }
  if (
    message.includes("expired") ||
    message.includes("session") ||
    message.includes("unauthenticated") ||
    message.includes("authentication required") ||
    message.includes("jwt")
  ) {
    return new IdentityError("SESSION_EXPIRED", "Votre session a expiré. Veuillez vous reconnecter.");
  }
  if (message.includes("network") || message.includes("fetch")) {
    return new IdentityError("NETWORK_ERROR", "Le service est momentanément indisponible. Vérifiez votre connexion.");
  }

  return new IdentityError("UNKNOWN_ERROR", "Une erreur inattendue est survenue.");
}
