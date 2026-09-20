import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import type {
  SellerFinanceTransaction,
  SellerPaymentMethod,
  SellerPaymentStatus,
  SellerRevenueCurrency,
  SellerRevenueEntry,
  SellerRevenueSnapshot,
  SellerTransactionStatus,
  SellerTransactionType,
} from "../types";

type Row =
  Record<string, unknown>;

function rows(
  value: unknown,
): Row[] {
  return Array.isArray(value)
    ? value as Row[]
    : [];
}

function text(
  value: unknown,
  fallback = "",
): string {
  return typeof value === "string"
    ? value
    : fallback;
}

function nullableText(
  value: unknown,
): string | null {
  const result =
    text(value);

  return result
    ? result
    : null;
}

function numeric(
  value: unknown,
): number {
  return Number(
    value ?? 0,
  );
}

function record(
  value: unknown,
): Row {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
    ? value as Row
    : {};
}

export class SellerFinanceRepository {
  private readonly client:
    SupabaseClient;

  constructor() {
    this.client =
      (
        createSupabaseBrowserClient()
      ) as unknown as SupabaseClient;
  }

  async transactions():
    Promise<SellerFinanceTransaction[]> {
    const {
      data,
      error,
    } =
      await this.client.rpc(
        "marketplace_seller_transaction_snapshot",
        {
          p_limit: 500,
        },
      );

    if (error) {
      throw error;
    }

    return rows(data).map(
      (
        row,
      ): SellerFinanceTransaction => ({
        id:
          text(
            row.transaction_id,
          ),

        orderId:
          text(
            row.order_id,
          ),

        type:
          text(
            row.transaction_type,
          ) as SellerTransactionType,

        status:
          text(
            row.transaction_status,
          ) as SellerTransactionStatus,

        amount:
          numeric(
            row.amount,
          ),

        currency:
          text(
            row.currency,
            "MGA",
          ),

        externalReference:
          nullableText(
            row.external_reference,
          ),

        createdAt:
          text(
            row.created_at,
          ),

        paymentId:
          nullableText(
            row.payment_id,
          ),

        paymentMethod:
          nullableText(
            row.payment_method,
          ) as SellerPaymentMethod | null,

        paymentStatus:
          nullableText(
            row.payment_status,
          ) as SellerPaymentStatus | null,

        providerReference:
          nullableText(
            row.provider_reference,
          ),

        paidAt:
          nullableText(
            row.paid_at,
          ),
      }),
    );
  }

  async revenue():
    Promise<SellerRevenueSnapshot> {
    const {
      data,
      error,
    } =
      await this.client.rpc(
        "marketplace_seller_revenue_snapshot",
      );

    if (error) {
      throw error;
    }

    const payload =
      record(data);

    const currencies:
      SellerRevenueCurrency[] =
        rows(
          payload.currencies,
        ).map(
          (
            row,
          ): SellerRevenueCurrency => ({
            currency:
              text(
                row.currency,
                "MGA",
              ),

            revenue:
              numeric(
                row.revenue,
              ),

            expense:
              numeric(
                row.expense,
              ),

            net:
              numeric(
                row.net,
              ),
          }),
        );

    const entries:
      SellerRevenueEntry[] =
        rows(
          payload.entries,
        ).map(
          (
            row,
          ): SellerRevenueEntry => ({
            id:
              text(
                row.id,
              ),

            paymentId:
              text(
                row.paymentId,
              ),

            entryType:
              text(
                row.entryType,
              ) as "revenue" | "expense",

            amount:
              numeric(
                row.amount,
              ),

            currency:
              text(
                row.currency,
                "MGA",
              ),

            occurredAt:
              text(
                row.occurredAt,
              ),

            description:
              text(
                row.description,
              ),

            reference:
              nullableText(
                row.reference,
              ),

            sourceId:
              nullableText(
                row.sourceId,
              ),

            orderId:
              nullableText(
                row.orderId,
              ),

            paymentMethod:
              nullableText(
                row.paymentMethod,
              ) as SellerPaymentMethod | null,

            providerReference:
              nullableText(
                row.providerReference,
              ),
          }),
        );

    return {
      organizationId:
        text(
          payload.organizationId,
        ),

      currencies,

      entries,
    };
  }
}