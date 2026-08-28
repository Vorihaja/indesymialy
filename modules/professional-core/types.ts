export type ProfessionalDomain = "licenses" | "memberships" | "medical" | "documents" | "contracts" | "sponsorship-contracts" | "payments" | "professional-finance" | "subscriptions" | "compliance";
export type ProfessionalRole = "fighter" | "club" | "coach" | "organizer" | "referee" | "judge" | "sponsor" | "federation" | "league" | "admin";
export type DataVisibility = "public" | "organization" | "private" | "medical_restricted" | "admin_only";
export type RecordStatus = "draft" | "pending" | "active" | "expired" | "suspended" | "revoked" | "rejected" | "paid" | "unpaid" | "cancelled";
export type PaymentStatus = "draft" | "pending" | "authorized" | "paid" | "failed" | "refunded" | "cancelled";

export interface ProfessionalRecord {
  id: string;
  domain: ProfessionalDomain;
  title: string;
  subtitle: string;
  status: RecordStatus;
  visibility: DataVisibility;
  amount?: number;
  currency?: string;
  issuedAt?: string;
  expiresAt?: string;
  ownerId: string;
  organizationId?: string;
  reference?: string;
  details: Readonly<Record<string, string | number | boolean>>;
  createdAt: string;
  updatedAt: string;
}

export interface LicenseRecord extends ProfessionalRecord { domain: "licenses"; licenseNumber: string; holderRole: ProfessionalRole; discipline: string; federation: string; league?: string; club?: string; }
export interface MembershipRecord extends ProfessionalRecord { domain: "memberships"; level: "club" | "league" | "federation"; periodStart: string; periodEnd: string; dueAt: string; }
export interface MedicalRecord extends ProfessionalRecord { domain: "medical"; visibility: "medical_restricted"; clearance: "fit" | "restricted" | "unfit" | "pending"; examinationType: "certificate" | "injury" | "ecg" | "mri" | "scan" | "analysis" | "clearance"; }
export interface DocumentRecord extends ProfessionalRecord { domain: "documents"; category: "identity" | "license" | "medical" | "contract" | "insurance" | "federation" | "event" | "sponsor" | "organization" | "other"; version: number; }
export interface ContractRecord extends ProfessionalRecord { domain: "contracts" | "sponsorship-contracts"; parties: readonly string[]; startsAt: string; endsAt: string; obligations: readonly string[]; }
export interface PaymentRecord extends ProfessionalRecord { domain: "payments"; paymentStatus: PaymentStatus; purpose: "membership" | "license" | "ticket" | "marketplace" | "sponsorship" | "subscription" | "registration" | "compensation"; payerId: string; beneficiaryId: string; method: "prepared" | "cash" | "transfer" | "mobile"; }
export interface SubscriptionRecord extends ProfessionalRecord { domain: "subscriptions"; plan: "free" | "professional" | "organization" | "premium"; period: "monthly" | "yearly"; renewal: boolean; }
export interface FinanceSummary { income: number; expense: number; balance: number; budget: number; currency: string; }
export interface ComplianceAlert { id: string; label: string; severity: "info" | "warning" | "critical"; dueAt?: string; status: "open" | "resolved"; visibility: DataVisibility; }
export interface ProfessionalSnapshot { records: ProfessionalRecord[]; finance: FinanceSummary; alerts: ComplianceAlert[]; loading: boolean; }
export interface ProfessionalQuery { domain: ProfessionalDomain; role: ProfessionalRole; search?: string; status?: RecordStatus | "all"; }
export interface CreateProfessionalRecord { title: string; subtitle: string; status?: RecordStatus; visibility?: DataVisibility; amount?: number; expiresAt?: string; reference?: string; }
export const DOMAIN_LABELS: Record<ProfessionalDomain, string> = { licenses:"Licences", memberships:"Adhésions et cotisations", medical:"Suivi médical", documents:"Documents", contracts:"Contrats", "sponsorship-contracts":"Sponsoring contractuel", payments:"Paiements", "professional-finance":"Finances professionnelles", subscriptions:"Abonnements plateforme", compliance:"Conformité" };
