export type FinanceScope =
  | 'platform'
  | 'organization'
  | 'event'
  | 'personal';

export type FinanceOwnerType =
  | 'platform'
  | 'organization'
  | 'event'
  | 'profile';
export type FinanceOperationType = 'income' | 'expense';
export type FinanceTab =
  | 'overview'
  | 'transactions'
  | 'income'
  | 'expenses'
  | 'categories'
  | 'seller-summary'
  | 'seller-revenue'
  | 'seller-transactions'
  | 'seller-commissions'
  | 'seller-settlements'
  | 'sponsor-budget'
  | 'federation-reports'
  | 'league-reports';

export type FinanceOwnerContext =
  | {
      scope: 'platform';
      ownerType: 'platform';
      ownerId: null;
    }
  | {
      scope: 'organization';
      ownerType: 'organization';
      ownerId: string;
    }
  | {
      scope: 'event';
      ownerType: 'event';
      ownerId: string;
    }
  | {
      scope: 'personal';
      ownerType: 'profile';
      ownerId: string;
    };

export type FinanceOwner = FinanceOwnerContext & {
  label: string;
};

export interface FinanceSnapshot {
  ownerType: FinanceOwnerType;
  ownerId: string | null;
  accountId: string | null;
  currencyCode: string;
  balance: number;
  totalRevenue: number;
  totalExpense: number;
}

export interface FinanceCategory {
  id: string;
  operationType: FinanceOperationType;
  name: string;
  description: string | null;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
}

export interface FinanceLedgerEntry {
  entryId: string;
  paymentId: string;
  entryType: FinanceOperationType;
  amount: number;
  currencyCode: string;
  occurredAt: string;
  description: string;
  reference: string | null;
  paymentKind: string;
  sourceType: string;
  sourceId: string | null;
  counterpartyOwnerType: string | null;
  counterpartyProfileId: string | null;
  counterpartyOrganizationId: string | null;
  isManual: boolean;
  manualOperationId: string | null;
  manualOperationType: FinanceOperationType | null;
  categoryId: string | null;
  categoryName: string | null;
  paymentMethod: string | null;
  counterpartyName: string | null;
  receiptPath: string | null;
  reversedAt: string | null;
}

export interface FinanceManualOperationDetails {
  id: string;
  operationType: FinanceOperationType;
  amount: number;
  currencyCode: string;
  categoryId: string | null;
  categoryName: string;
  description: string;
  occurredAt: string;
  reference: string | null;
  paymentMethod: string | null;
  counterpartyName: string | null;
  notes: string | null;
  receiptPath: string | null;
  reversedAt: string | null;
}

export interface CreateFinanceCategoryInput {
  owner: FinanceOwner;
  operationType: FinanceOperationType;
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateFinanceCategoryInput {
  owner: FinanceOwnerContext;
  categoryId: string;
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface ManualFinanceOperationInput {
  owner: FinanceOwner;
  operationType: FinanceOperationType;
  amount: number;
  currencyCode: string;
  categoryId?: string;
  categoryName: string;
  description: string;
  idempotencyKey: string;
  occurredAt?: string;
  reference?: string;
  paymentMethod?: string;
  counterpartyName?: string;
  notes?: string;
  receiptPath?: string;
}

export interface ReverseManualOperationInput {
  owner: FinanceOwnerContext;
  operationId: string;
  idempotencyKey: string;
  reason?: string;
  occurredAt?: string;
}

export interface FinancePeriod {
  from?: string;
  to?: string;
}
