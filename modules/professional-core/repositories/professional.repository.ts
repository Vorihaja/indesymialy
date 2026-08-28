import type { ComplianceAlert, CreateProfessionalRecord, FinanceSummary, ProfessionalDomain, ProfessionalQuery, ProfessionalRecord } from "../types";
export interface ProfessionalRepository {
  list(query: ProfessionalQuery): Promise<ProfessionalRecord[]>;
  create(domain: ProfessionalDomain, input: CreateProfessionalRecord): Promise<ProfessionalRecord>;
  update(id: string, input: Partial<CreateProfessionalRecord>): Promise<ProfessionalRecord>;
  remove(id: string): Promise<void>;
  finance(role: ProfessionalQuery["role"]): Promise<FinanceSummary>;
  compliance(role: ProfessionalQuery["role"]): Promise<ComplianceAlert[]>;
}
