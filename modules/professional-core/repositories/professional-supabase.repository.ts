import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import { storageNotImplemented } from "../../../shared/errors/backend-error";
import { ProfessionalMemoryRepository } from "./professional-memory.repository";
import type {
  ComplianceAlert,
  CreateProfessionalRecord,
  FinanceSummary,
  ProfessionalDomain,
  ProfessionalQuery,
  ProfessionalRecord,
} from "../types";

const PROFESSIONAL_RECORD_STATUSES: readonly ProfessionalRecord["status"][] = [
  "draft",
  "pending",
  "active",
  "expired",
  "suspended",
  "revoked",
  "rejected",
  "paid",
  "unpaid",
  "cancelled",
];

function isProfessionalRecordStatus(
  value: string,
): value is ProfessionalRecord["status"] {
  return PROFESSIONAL_RECORD_STATUSES.some((status) => status === value);
}

function normalizeContractStatus(
  status: string | null,
): ProfessionalRecord["status"] {
  const normalized = status?.trim().toLowerCase();

  if (!normalized || normalized === "en cours") {
    return "active";
  }

  return isProfessionalRecordStatus(normalized)
    ? normalized
    : "active";
}

export class ProfessionalSupabaseRepository extends ProfessionalMemoryRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {
    super();
  }

  override async list(query: ProfessionalQuery): Promise<ProfessionalRecord[]> {
    try {
      const memoryRecords = await super.list(query);

      if (query.domain === "contracts") {
        const { data: dbContracts } = await this.supabase
          .from("contracts")
          .select("*");

        if (dbContracts && dbContracts.length > 0) {
          const dbRecords: ProfessionalRecord[] = dbContracts.map((c) => ({
            id: c.id,
            domain: "contracts",
            title: `Contrat - ${c.type ?? "Professionnel"}`,
            subtitle: `Statut: ${c.status ?? "Actif"}`,
            status: normalizeContractStatus(c.status),
            visibility: "private",
            amount: c.amount ? Number(c.amount) : undefined,
            currency: "MGA",
            issuedAt: c.start_date ?? undefined,
            expiresAt: c.end_date ?? undefined,
            ownerId: c.beneficiary ?? "system",
            reference: c.ref ?? c.id.slice(0, 8).toUpperCase(),
            details: { contractType: c.type, note: c.details ?? "" },
            createdAt: c.created_at ?? new Date().toISOString(),
            updatedAt: c.created_at ?? new Date().toISOString(),
          }));
          return [...dbRecords, ...memoryRecords.filter((m) => !dbRecords.some((d) => d.id === m.id))];
        }
      }

      return memoryRecords;
    } catch {
      return super.list(query);
    }
  }

  override async create(domain: ProfessionalDomain, input: CreateProfessionalRecord): Promise<ProfessionalRecord> {
    void input;
    throw storageNotImplemented(`création ${domain}`);
  }

  override async update(): Promise<ProfessionalRecord> {
    throw storageNotImplemented("mise à jour des dossiers professionnels");
  }

  override async remove(): Promise<void> {
    throw storageNotImplemented("suppression des dossiers professionnels");
  }

  override async finance(role: ProfessionalQuery["role"]): Promise<FinanceSummary> {
    return super.finance(role);
  }

  override async compliance(role: ProfessionalQuery["role"]): Promise<ComplianceAlert[]> {
    return super.compliance(role);
  }
}
