import type { ErpMarketplaceRole, VerificationStatus } from './types';

export const VERIFIED_COMMISSION_RATE = 0.04;
export const UNVERIFIED_COMMISSION_RATE = 0.09;
const KEY_PREFIX = 'indesy-mialy.marketplace.verification.';

export function defaultVerificationStatus(_role: ErpMarketplaceRole): VerificationStatus {
  return 'Non vérifié';
}

export function getVerificationStatus(role: ErpMarketplaceRole): VerificationStatus {
  if (typeof window === 'undefined') return defaultVerificationStatus(role);
  return (window.localStorage.getItem(`${KEY_PREFIX}${role}`) as VerificationStatus | null) ?? defaultVerificationStatus(role);
}

export function setVerificationStatus(role: ErpMarketplaceRole, status: VerificationStatus) {
  window.localStorage.setItem(`${KEY_PREFIX}${role}`, status);
  window.dispatchEvent(new CustomEvent('indesy-verification-updated', { detail: { role, status } }));
}

export function commissionRateFor(status: VerificationStatus) {
  return status === 'Vérifié' ? VERIFIED_COMMISSION_RATE : UNVERIFIED_COMMISSION_RATE;
}

export function commissionBreakdown(gross: number, status: VerificationStatus) {
  const rate = commissionRateFor(status);
  const commission = Math.round(gross * rate);
  return { gross, rate, commission, net: gross - commission };
}

export const VERIFICATION_PRIVILEGES = [
  'Badge de confiance visible',
  'Commission plateforme réduite',
  'Visibilité renforcée dans la Marketplace',
  'Priorité dans les recommandations',
  'Accès aux indicateurs vendeur avancés',
] as const;
