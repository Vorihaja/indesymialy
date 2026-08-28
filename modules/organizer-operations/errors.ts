import { BackendError } from '@/shared/errors/backend-error';
import type { OrganizerOperationsErrorCode } from './types';

const messages: Record<OrganizerOperationsErrorCode, string> = {
  UNAUTHENTICATED: 'Vous devez être connecté pour accéder à cet espace.',
  ORGANIZATION_NOT_FOUND: 'Aucune organisation Organisateur active n’est associée à ce compte.',
  EVENT_NOT_FOUND: 'Aucun événement actif n’est disponible pour cette organisation.',
  FORBIDDEN: 'Vous n’êtes pas autorisé à consulter ces données organisateur.',
  NOT_FOUND: 'La ressource demandée est introuvable.',
  VALIDATION_ERROR: 'Les informations fournies sont invalides.',
  FOREIGN_KEY_ERROR: 'Une ressource liée est absente ou encore utilisée.',
  UNIQUE_CONSTRAINT_ERROR: 'Cette ressource existe déjà.',
  NETWORK_ERROR: 'Le service est momentanément indisponible.',
  STORAGE_NOT_IMPLEMENTED: 'Cette capacité ne possède pas encore de stockage persistant.',
  UNKNOWN_ERROR: 'Une erreur inattendue est survenue.',
};

export class OrganizerOperationsError extends Error {
  constructor(
    public readonly code: OrganizerOperationsErrorCode,
    message = messages[code],
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'OrganizerOperationsError';
  }
}

export function normalizeOrganizerOperationsError(reason: unknown): OrganizerOperationsError {
  if (reason instanceof OrganizerOperationsError) return reason;
  if (reason instanceof BackendError) return new OrganizerOperationsError(reason.code, reason.message, reason);
  const source = reason as { code?: string; message?: string; status?: number } | null;
  const code = source?.code ?? '';
  const message = source?.message?.toLowerCase() ?? '';
  if (code === '23503') return new OrganizerOperationsError('FOREIGN_KEY_ERROR', undefined, reason);
  if (code === '23505') return new OrganizerOperationsError('UNIQUE_CONSTRAINT_ERROR', undefined, reason);
  if (code === 'PGRST116') return new OrganizerOperationsError('NOT_FOUND', undefined, reason);
  if (code === '42501' || source?.status === 403 || message.includes('row-level security') || message.includes('permission denied')) return new OrganizerOperationsError('FORBIDDEN', undefined, reason);
  if (source?.status === 401 || message.includes('jwt')) return new OrganizerOperationsError('UNAUTHENTICATED', undefined, reason);
  if (message.includes('fetch') || message.includes('network')) return new OrganizerOperationsError('NETWORK_ERROR', undefined, reason);
  if (message.includes('invalid') || message.includes('required')) return new OrganizerOperationsError('VALIDATION_ERROR', undefined, reason);
  return new OrganizerOperationsError('UNKNOWN_ERROR', undefined, reason);
}
