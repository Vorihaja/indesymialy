import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/infrastructure/supabase/database.types';
import type {
  CreateFinanceCategoryInput,
  FinanceCategory,
  FinanceLedgerEntry,
  FinanceManualOperationDetails,
  FinanceOwner,
  FinanceOwnerContext,
  FinancePeriod,
  FinanceSnapshot,
  FinanceScope,
  ManualFinanceOperationInput,
  ReverseManualOperationInput,
  UpdateFinanceCategoryInput,
} from './types';
import { ownerContextKey } from './owner-context';

type GeneratedFinanceRpcName =
  | 'archive_finance_category'
  | 'create_finance_category'
  | 'get_finance_account_snapshot'
  | 'get_finance_categories'
  | 'get_finance_ledger_entries'
  | 'list_finance_owners'
  | 'post_manual_financial_operation'
  | 'reverse_manual_financial_operation'
  | 'update_finance_category';

type FinanceRpcDefinitions = Pick<
  Database['public']['Functions'],
  GeneratedFinanceRpcName
> & {
  // Added by the local F1 migration. Generated types must only be refreshed
  // after that migration is applied to the database.
  get_finance_manual_operation: {
    Args: {
      p_operation_id: string;
      p_owner_type: string;
      p_owner_id: string | null;
    };
    Returns: Database['public']['Functions'][
      'get_finance_account_snapshot'
    ]['Returns'];
  };
};

type NullableRpcArgs<Args> = Args extends object
  ? { [Key in keyof Args]: Args[Key] | null }
  : Args;

type FinanceRpcClient = {
  rpc<Name extends keyof FinanceRpcDefinitions>(
    name: Name,
    ...args: FinanceRpcDefinitions[Name]['Args'] extends never
      ? []
      : [NullableRpcArgs<FinanceRpcDefinitions[Name]['Args']>]
  ): PromiseLike<{
    data: FinanceRpcDefinitions[Name]['Returns'] | null;
    error: { message?: string } | null;
  }>;
};

function errorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return 'Erreur Supabase.';
}

function expectArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is Record<string, unknown> =>
      typeof item === 'object' &&
      item !== null,
  );
}

function objectValue(value: unknown): Record<string, unknown> {
  if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function nullableText(value: unknown): string | null {
  const valueText = text(value);
  return valueText ? valueText : null;
}

function numeric(value: unknown): number {
  const converted = Number(value);
  return Number.isFinite(converted) ? converted : 0;
}

function operationType(
  value: unknown,
): 'income' | 'expense' {
  return value === 'revenue' || value === 'income' ? 'income' : 'expense';
}

export class FinanceRepository {
  private readonly rpcClient: FinanceRpcClient;
  private authorizedOwnerKeys = new Set<string>();

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly expectedScope: FinanceScope,
  ) {
    this.rpcClient =
      supabase as unknown as FinanceRpcClient;
  }

  async owners(): Promise<FinanceOwner[]> {
    const { data, error } =
      await this.rpcClient.rpc(
        'list_finance_owners',
      );

    if (error) throw new Error(errorMessage(error));

    const owners = expectArray(data).flatMap((row): FinanceOwner[] => {
      const ownerId = text(row.owner_id);
      if (!ownerId) return [];

      if (row.owner_type === 'organization') {
        return this.expectedScope === 'organization' ? [{
          scope: 'organization',
          ownerType: 'organization',
          ownerId,
          label: text(row.label) || 'Organisation',
        }] : [];
      }

      if (row.owner_type === 'profile') {
        return this.expectedScope === 'personal' ? [{
          scope: 'personal',
          ownerType: 'profile',
          ownerId,
          label: text(row.label) || 'Personnel',
        }] : [];
      }

      return [];
    });

    this.authorizedOwnerKeys = new Set(
      owners.map(ownerContextKey),
    );
    return owners;
  }

  private async requireAuthenticatedUser(): Promise<string> {
    const result = await this.supabase.auth.getUser();
    if (result.error || !result.data.user) {
      throw new Error('Session Finance non authentifiee.');
    }
    return result.data.user.id;
  }

  private requireAuthorizedOwner(owner: FinanceOwnerContext): void {
    if (!this.authorizedOwnerKeys.has(ownerContextKey(owner))) {
      throw new Error('Contexte proprietaire Finance non autorise.');
    }
  }

  async snapshot(
    owner: FinanceOwner,
    currencyCode = 'MGA',
  ): Promise<FinanceSnapshot> {
    this.requireAuthorizedOwner(owner);
    const { data, error } =
      await this.rpcClient.rpc(
        'get_finance_account_snapshot',
        {
          p_owner_type: owner.ownerType,
          p_owner_id: owner.ownerId,
          p_currency_code: currencyCode,
        },
      );

    if (error) {
      throw new Error(errorMessage(error));
    }

    const row = objectValue(data);

    return {
      ownerType: owner.ownerType,
      ownerId: owner.ownerId,
      accountId:
        nullableText(row.accountId) ??
        nullableText(row.account_id),
      currencyCode:
        text(row.currencyCode) ||
        text(row.currency_code) ||
        currencyCode,
      balance: numeric(row.balance),
      totalRevenue:
        numeric(row.totalRevenue) ||
        numeric(row.total_revenue),
      totalExpense:
        numeric(row.totalExpense) ||
        numeric(row.total_expense),
    };
  }

  async entries(
    owner: FinanceOwner,
    period: FinancePeriod = {},
    limit = 300,
  ): Promise<FinanceLedgerEntry[]> {
    this.requireAuthorizedOwner(owner);
    const { data, error } =
      await this.rpcClient.rpc(
        'get_finance_ledger_entries',
        {
          p_owner_type: owner.ownerType,
          p_owner_id: owner.ownerId,
          p_currency_code: 'MGA',
          p_from: period.from ?? null,
          p_to: period.to ?? null,
          p_limit: limit,
        },
      );

    if (error) {
      throw new Error(errorMessage(error));
    }

    return expectArray(data).map((row) => ({
      entryId: text(row.entry_id),
      paymentId: text(row.payment_id),
      entryType: operationType(row.entry_type),
      amount: numeric(row.amount),
      currencyCode:
        text(row.currency_code) || 'MGA',
      occurredAt: text(row.occurred_at),
      description: text(row.description),
      reference: nullableText(row.reference),
      paymentKind: text(row.payment_kind),
      sourceType: text(row.source_type),
      sourceId: nullableText(row.source_id),
      counterpartyOwnerType:
        nullableText(row.counterparty_owner_type),
      counterpartyProfileId:
        nullableText(row.counterparty_profile_id),
      counterpartyOrganizationId:
        nullableText(
          row.counterparty_organization_id,
        ),
      isManual: row.is_manual === true,
      manualOperationId:
        nullableText(row.manual_operation_id),
      manualOperationType:
        row.manual_operation_type === 'income'
          ? 'income'
          : row.manual_operation_type === 'expense'
            ? 'expense'
            : null,
      categoryId:
        nullableText(row.category_id),
      categoryName:
        nullableText(row.category_name),
      paymentMethod:
        nullableText(row.payment_method),
      counterpartyName:
        nullableText(row.counterparty_name),
      receiptPath:
        nullableText(row.receipt_path),
      reversedAt:
        nullableText(row.reversed_at),
    }));
  }

  async manualOperation(
    owner: FinanceOwnerContext,
    operationId: string,
  ): Promise<FinanceManualOperationDetails | null> {
    this.requireAuthorizedOwner(owner);
    const { data, error } = await this.rpcClient.rpc(
      'get_finance_manual_operation',
      {
        p_operation_id: operationId,
        p_owner_type: owner.ownerType,
        p_owner_id: owner.ownerId,
      },
    );

    if (error) {
      throw new Error(errorMessage(error));
    }

    const operation = objectValue(data);
    if (!text(operation.id)) {
      return null;
    }

    return {
      id: text(operation.id),
      operationType:
        operationType(operation.operation_type),
      amount: numeric(operation.amount),
      currencyCode:
        text(operation.currency_code) || 'MGA',
      categoryId:
        nullableText(operation.category_id),
      categoryName:
        text(operation.category_name),
      description:
        text(operation.description),
      occurredAt:
        text(operation.occurred_at),
      reference:
        nullableText(operation.reference),
      paymentMethod:
        nullableText(operation.payment_method),
      counterpartyName:
        nullableText(operation.counterparty_name),
      notes:
        nullableText(operation.notes),
      receiptPath:
        nullableText(operation.receipt_path),
      reversedAt:
        nullableText(operation.reversed_at),
    };
  }

  async categories(
    owner: FinanceOwner,
  ): Promise<FinanceCategory[]> {
    this.requireAuthorizedOwner(owner);
    const { data, error } =
      await this.rpcClient.rpc(
        'get_finance_categories',
        {
          p_owner_type: owner.ownerType,
          p_owner_id: owner.ownerId,
          p_operation_type: null,
        },
      );

    if (error) {
      throw new Error(errorMessage(error));
    }

    return expectArray(data).map((row) => ({
      id: text(row.id),
      operationType:
        operationType(row.operation_type),
      name: text(row.name),
      description:
        nullableText(row.description),
      sortOrder: numeric(row.sort_order),
      archivedAt:
        nullableText(row.archived_at),
      createdAt: text(row.created_at),
    }));
  }

  async createCategory(
    input: CreateFinanceCategoryInput,
  ): Promise<string> {
    await this.requireAuthenticatedUser();
    this.requireAuthorizedOwner(input.owner);
    const { data, error } =
      await this.rpcClient.rpc(
        'create_finance_category',
        {
          p_owner_type: input.owner.ownerType,
          p_owner_id: input.owner.ownerId,
          p_operation_type: input.operationType,
          p_name: input.name,
          p_description:
            input.description ?? null,
          p_sort_order:
            input.sortOrder ?? 0,
        },
      );

    if (error) {
      throw new Error(errorMessage(error));
    }

    const id = text(data);

    if (!id) {
      throw new Error(
        'La catégorie créée n’a retourné aucun identifiant.',
      );
    }

    return id;
  }

  async updateCategory(
    input: UpdateFinanceCategoryInput,
  ): Promise<string> {
    await this.requireAuthenticatedUser();
    this.requireAuthorizedOwner(input.owner);
    const { data, error } =
      await this.rpcClient.rpc(
        'update_finance_category',
        {
          p_category_id: input.categoryId,
          p_name: input.name,
          p_description:
            input.description ?? null,
          p_sort_order:
            input.sortOrder ?? 0,
        },
      );

    if (error) {
      throw new Error(errorMessage(error));
    }

    return text(data);
  }

  async archiveCategory(
    owner: FinanceOwnerContext,
    categoryId: string,
  ): Promise<void> {
    await this.requireAuthenticatedUser();
    this.requireAuthorizedOwner(owner);
    const { error } =
      await this.rpcClient.rpc(
        'archive_finance_category',
        {
          p_category_id: categoryId,
        },
      );

    if (error) {
      throw new Error(errorMessage(error));
    }
  }

  async postManualOperation(
    input: ManualFinanceOperationInput,
  ): Promise<string> {
    await this.requireAuthenticatedUser();
    this.requireAuthorizedOwner(input.owner);
    const { data, error } =
      await this.rpcClient.rpc(
        'post_manual_financial_operation',
        {
          p_owner_type: input.owner.ownerType,
          p_owner_id: input.owner.ownerId,
          p_operation_type:
            input.operationType,
          p_amount: input.amount,
          p_currency_code:
            input.currencyCode,
          p_category_name:
            input.categoryName,
          p_description:
            input.description,
          p_idempotency_key:
            input.idempotencyKey,
          p_category_id:
            input.categoryId ?? null,
          p_occurred_at:
            input.occurredAt ?? null,
          p_reference:
            input.reference ?? null,
          p_payment_method:
            input.paymentMethod ?? null,
          p_counterparty_name:
            input.counterpartyName ?? null,
          p_notes:
            input.notes ?? null,
          p_receipt_path:
            input.receiptPath ?? null,
        },
      );

    if (error) {
      throw new Error(errorMessage(error));
    }

    const id = text(data);

    if (!id) {
      throw new Error(
        'L’opération n’a retourné aucun identifiant.',
      );
    }

    return id;
  }

  async reverseManualOperation(
    input: ReverseManualOperationInput,
  ): Promise<string> {
    await this.requireAuthenticatedUser();
    this.requireAuthorizedOwner(input.owner);
    const { data, error } =
      await this.rpcClient.rpc(
        'reverse_manual_financial_operation',
        {
          p_operation_id:
            input.operationId,
          p_idempotency_key:
            input.idempotencyKey,
          p_reason:
            input.reason ?? null,
          p_occurred_at:
            input.occurredAt ?? null,
        },
      );

    if (error) {
      throw new Error(errorMessage(error));
    }

    return text(data);
  }
}
