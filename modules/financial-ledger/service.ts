import { FinancialLedgerRepository } from './repository';
import type { PostFinancialPaymentInput, RefundFinancialPaymentInput } from './types';

export class FinancialLedgerService {
  constructor(private readonly repository: FinancialLedgerRepository) {}

  postPayment(input: PostFinancialPaymentInput) {
    return this.repository.postPayment(input);
  }

  refundPayment(input: RefundFinancialPaymentInput) {
    return this.repository.refundPayment(input);
  }
}
