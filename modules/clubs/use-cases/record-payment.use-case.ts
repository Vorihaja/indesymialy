import type { UUID } from "@/types/common";
import type { ClubTransaction } from "../types";
import { FinanceService } from "../services/finance.service";
export type RecordPaymentInput = Omit<ClubTransaction, "id">;
export class RecordPaymentUseCase {
  constructor(private readonly service: FinanceService) {}
  async execute(input: RecordPaymentInput): Promise<ClubTransaction> {
    if (!input.organization_id) throw new Error("Le club est obligatoire");
    if (!input.transaction_type) throw new Error("Le type de transaction est obligatoire");
    if (!input.category) throw new Error("La catÃ©gorie est obligatoire");
    if (input.amount <= 0) throw new Error("Le montant doit Ãªtre supÃ©rieur Ã  zÃ©ro");
    return this.service.createTransaction(input);
  }
  async update(id: UUID, input: Partial<ClubTransaction>): Promise<ClubTransaction> { return this.service.updateTransaction(id, input); }
  async remove(id: UUID): Promise<void> { await this.service.deleteTransaction(id); }
}