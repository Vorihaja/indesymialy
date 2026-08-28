export type BackendErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "FOREIGN_KEY_ERROR"
  | "UNIQUE_CONSTRAINT_ERROR"
  | "NETWORK_ERROR"
  | "STORAGE_NOT_IMPLEMENTED"
  | "UNKNOWN_ERROR";

const messages: Record<BackendErrorCode, string> = {
  UNAUTHENTICATED: "Vous devez être connecté pour effectuer cette action.",
  FORBIDDEN: "Vous n’êtes pas autorisé à effectuer cette action.",
  NOT_FOUND: "La ressource demandée est introuvable.",
  VALIDATION_ERROR: "Les informations fournies sont invalides.",
  FOREIGN_KEY_ERROR: "Une ressource liée est introuvable ou encore utilisée.",
  UNIQUE_CONSTRAINT_ERROR: "Cette ressource existe déjà.",
  NETWORK_ERROR: "Le service est momentanément indisponible.",
  STORAGE_NOT_IMPLEMENTED: "Cette capacité n’est pas encore persistée.",
  UNKNOWN_ERROR: "Une erreur inattendue est survenue.",
};

export class BackendError extends Error {
  constructor(
    public readonly code: BackendErrorCode,
    message = messages[code],
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "BackendError";
  }
}

interface PostgrestLikeError {
  code?: string;
  message?: string;
  status?: number;
}

export function normalizeBackendError(reason: unknown): BackendError {
  if (reason instanceof BackendError) return reason;

  const source = reason as PostgrestLikeError | null;
  const code = source?.code ?? "";
  const message = source?.message?.toLowerCase() ?? "";

  if (code === "P0001" && (message.includes("no organization associated") || message.includes("organization required"))) {
    return new BackendError("VALIDATION_ERROR", "Créez ou activez une organisation adaptée avant d’effectuer cette action.", reason);
  }
  if (code === "P0001" && message.includes("event access denied")) return new BackendError("FORBIDDEN", undefined, reason);
  if (code === "P0001" && message.includes("authentication required")) return new BackendError("UNAUTHENTICATED", undefined, reason);
  if (["22P02", "22003", "22007", "23502", "23514"].includes(code)) return new BackendError("VALIDATION_ERROR", undefined, reason);
  if (code === "23503") return new BackendError("FOREIGN_KEY_ERROR", undefined, reason);
  if (code === "23505") return new BackendError("UNIQUE_CONSTRAINT_ERROR", undefined, reason);
  if (code === "PGRST116") return new BackendError("NOT_FOUND", undefined, reason);
  if (code === "28000" || source?.status === 401 || message.includes("jwt")) {
    return new BackendError("UNAUTHENTICATED", undefined, reason);
  }
  if (code === "42501" || source?.status === 403 || message.includes("row-level security") || message.includes("permission denied") || message.includes("access denied")) {
    return new BackendError("FORBIDDEN", undefined, reason);
  }
  if (message.includes("fetch") || message.includes("network")) {
    return new BackendError("NETWORK_ERROR", undefined, reason);
  }
  if (message.includes("invalid") || message.includes("required") || message.includes("obligatoire")) {
    return new BackendError("VALIDATION_ERROR", undefined, reason);
  }

  return new BackendError("UNKNOWN_ERROR", undefined, reason);
}

export function storageNotImplemented(capability: string): BackendError {
  return new BackendError(
    "STORAGE_NOT_IMPLEMENTED",
    `La persistance de « ${capability} » n’est pas disponible dans le schéma actuel.`
  );
}
