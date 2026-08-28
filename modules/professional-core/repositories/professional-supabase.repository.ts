import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import { ProfessionalMemoryRepository } from "./professional-memory.repository";
import type {
  ComplianceAlert,
  CreateProfessionalRecord,
  FinanceSummary,
  ProfessionalDomain,
  ProfessionalQuery,
  ProfessionalRecord,
} from "../types";

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
            status: (c.status as any) || "active",
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
    return super.create(domain, input);
  }

  override async finance(role: ProfessionalQuery["role"]): Promise<FinanceSummary> {
    return super.finance(role);
  }

  override async compliance(role: ProfessionalQuery["role"]): Promise<ComplianceAlert[]> {
    return super.compliance(role);
  }
}
