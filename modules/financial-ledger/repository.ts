import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/infrastructure/supabase/database.types';
import { normalizeBackendError } from '@/shared/errors/backend-error';
import type { PostFinancialPaymentInput, RefundFinancialPaymentInput } from './types';

type LedgerRpcClient = {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{
    data: string | null;
    error: unknown;
  }>;
};

export class FinancialLedgerRepository {
  private readonly rpcClient: LedgerRpcClient;

  constructor(supabase: SupabaseClient<Database>) {
    this.rpcClient = supabase as unknown as LedgerRpcClient;
  }

  async postPayment(input: PostFinancialPaymentInput): Promise<string> {
    const { data, error } = await this.rpcClient.rpc('post_financial_payment', {
      p_payer_type: input.payer.type,
      p_payer_id: input.payer.id,
      p_payee_type: input.payee.type,
      p_payee_id: input.payee.id,
      p_amount: input.amount,
      p_currency_code: input.currencyCode ?? 'MGA',
      p_idempotency_key: input.idempotencyKey,
      p_source_type: input.sourceType,
      p_source_id: input.sourceId ?? null,
      p_reference: input.reference ?? null,
      p_description: input.description,
      p_occurred_at: input.occurredAt ?? new Date().toISOString(),
    });
    if (error) throw normalizeBackendError(error);
    if (!data) throw new Error('Le paiement financier n’a retourné aucun identifiant.');
    return data;
  }

  async refundPayment(input: RefundFinancialPaymentInput): Promise<string> {
    const { data, error } = await this.rpcClient.rpc('refund_financial_payment', {
      p_payment_id: input.paymentId,
      p_idempotency_key: input.idempotencyKey,
      p_reference: input.reference ?? null,
      p_description: input.description ?? null,
      p_occurred_at: input.occurredAt ?? new Date().toISOString(),
    });
    if (error) throw normalizeBackendError(error);
    if (!data) throw new Error('Le remboursement financier n’a retourné aucun identifiant.');
    return data;
  }
}
