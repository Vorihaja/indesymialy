export type FinancialOwnerType = 'profile' | 'organization';
export type FinancialEntryType = 'expense' | 'revenue';

export interface FinancialParty {
  type: FinancialOwnerType;
  id: string;
}

export interface PostFinancialPaymentInput {
  payer: FinancialParty;
  payee: FinancialParty;
  amount: number;
  currencyCode?: string;
  idempotencyKey: string;
  sourceType: string;
  sourceId?: string;
  reference?: string;
  description: string;
  occurredAt?: string;
}

export interface RefundFinancialPaymentInput {
  paymentId: string;
  idempotencyKey: string;
  reference?: string;
  description?: string;
  occurredAt?: string;
}

export interface FinancialEntry {
  id: string;
  paymentId: string;
  accountId: string;
  type: FinancialEntryType;
  amount: number;
  currencyCode: string;
  occurredAt: string;
  description: string;
  counterpartyAccountId: string;
}
