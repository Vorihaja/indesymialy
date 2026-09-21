import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import {
  normalizeBackendError,
  storageNotImplemented,
} from "../../../shared/errors/backend-error";
import type { ProfessionalRepository } from "./professional.repository";
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

export class ProfessionalSupabaseRepository
  implements ProfessionalRepository
{
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(
    query: ProfessionalQuery,
  ): Promise<ProfessionalRecord[]> {
    if (query.domain !== "contracts") {
      throw storageNotImplemented(`lecture ${query.domain}`);
    }

    try {
      const { data: dbContracts, error } = await this.supabase
        .from("contracts")
        .select("*");

      if (error) {
        throw error;
      }

      const records: ProfessionalRecord[] = (dbContracts ?? []).map(
        (contract) => ({
          id: contract.id,
          domain: "contracts",
          title: `Contrat - ${contract.type ?? "Professionnel"}`,
          subtitle: `Statut: ${contract.status ?? "Actif"}`,
          status: normalizeContractStatus(contract.status),
          visibility: "private",
          amount: contract.amount
            ? Number(contract.amount)
            : undefined,
          currency: "MGA",
          issuedAt: contract.start_date ?? undefined,
          expiresAt: contract.end_date ?? undefined,
          ownerId: contract.beneficiary ?? "system",
          reference:
            contract.ref ??
            contract.id.slice(0, 8).toUpperCase(),
          details: {
            contractType: contract.type,
            note: contract.details ?? "",
          },
          createdAt:
            contract.created_at ??
            new Date().toISOString(),
          updatedAt:
            contract.created_at ??
            new Date().toISOString(),
        }),
      );

      const term = query.search?.trim().toLowerCase();

      return records.filter(
        (item) =>
          (!term ||
            `${item.title} ${item.subtitle} ${item.reference ?? ""}`
              .toLowerCase()
              .includes(term)) &&
          (!query.status ||
            query.status === "all" ||
            item.status === query.status),
      );
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  async create(
    domain: ProfessionalDomain,
    input: CreateProfessionalRecord,
  ): Promise<ProfessionalRecord> {
    void input;
    throw storageNotImplemented(`création ${domain}`);
  }

  async update(): Promise<ProfessionalRecord> {
    throw storageNotImplemented(
      "mise à jour des dossiers professionnels",
    );
  }

  async remove(): Promise<void> {
    throw storageNotImplemented(
      "suppression des dossiers professionnels",
    );
  }

  async finance(
    role: ProfessionalQuery["role"],
  ): Promise<FinanceSummary> {
    void role;
    throw storageNotImplemented(
      "synthèse financière professionnelle",
    );
  }

  async compliance(
    role: ProfessionalQuery["role"],
  ): Promise<ComplianceAlert[]> {
    void role;
    throw storageNotImplemented(
      "conformité professionnelle",
    );
  }
}