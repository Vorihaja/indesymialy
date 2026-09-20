import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import type {
  MarketplaceAmount,
  MarketplaceCurrencySummary,
  MarketplaceCustomerPerformance,
  MarketplaceLedgerCurrency,
  MarketplaceLedgerEntry,
  MarketplacePerformanceSnapshot,
  MarketplaceProductPerformance,
  SellerMarketplaceSnapshot,
} from "../types";

type JsonRecord =
  Record<string, unknown>;

type RpcError = {
  message: string;
};

type RpcResult = {
  data: unknown;
  error: RpcError | null;
};

type RpcClient = {
  rpc(
    name: string,
    args?: Record<string, unknown>,
  ): Promise<RpcResult>;
};

function asRecord(
  value: unknown,
): JsonRecord {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return value as JsonRecord;
}

function asRows(
  value: unknown,
): JsonRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (
      item,
    ): item is JsonRecord =>
      item !== null &&
      typeof item === "object" &&
      !Array.isArray(item),
  );
}

function asString(
  value: unknown,
  fallback = "",
): string {
  return typeof value === "string"
    ? value
    : fallback;
}

function asNullableString(
  value: unknown,
): string | null {
  return typeof value === "string" &&
    value.length > 0
    ? value
    : null;
}

function asNumber(
  value: unknown,
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim().length > 0
  ) {
    const parsed =
      Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  }

  return 0;
}

function mapAmount(
  value: unknown,
): MarketplaceAmount {
  const row =
    asRecord(value);

  const units =
    row.units;

  return {
    currency:
      asString(
        row.currency,
        "MGA",
      ),

    orders:
      asNumber(
        row.orders,
      ),

    revenue:
      asNumber(
        row.revenue,
      ),

    units:
      units === null ||
      units === undefined
        ? undefined
        : asNumber(
            units,
          ),
  };
}

function mapCurrency(
  value: unknown,
): MarketplaceCurrencySummary {
  const row =
    asRecord(value);

  return {
    currency:
      asString(
        row.currency,
        "MGA",
      ),

    orders:
      asNumber(
        row.orders,
      ),

    subtotal:
      asNumber(
        row.subtotal,
      ),

    total:
      asNumber(
        row.total,
      ),

    averageOrder:
      asNumber(
        row.averageOrder,
      ),
  };
}

function mapProduct(
  value: unknown,
): MarketplaceProductPerformance {
  const row =
    asRecord(value);

  return {
    productId:
      asString(
        row.productId,
      ),

    title:
      asString(
        row.title,
        "Produit",
      ),

    orders:
      asNumber(
        row.orders,
      ),

    units:
      asNumber(
        row.units,
      ),

    amounts:
      asRows(
        row.amounts,
      ).map(
        mapAmount,
      ),
  };
}

function mapCustomer(
  value: unknown,
): MarketplaceCustomerPerformance {
  const row =
    asRecord(value);

  return {
    customerId:
      asString(
        row.customerId,
      ),

    name:
      asString(
        row.name,
        "Client",
      ),

    orders:
      asNumber(
        row.orders,
      ),

    amounts:
      asRows(
        row.amounts,
      ).map(
        mapAmount,
      ),
  };
}

function mapLedgerCurrency(
  value: unknown,
): MarketplaceLedgerCurrency {
  const row =
    asRecord(value);

  return {
    currency:
      asString(
        row.currency,
        "MGA",
      ),

    revenue:
      asNumber(
        row.revenue,
      ),

    expense:
      asNumber(
        row.expense,
      ),

    net:
      asNumber(
        row.net,
      ),
  };
}

function mapLedgerEntry(
  value: unknown,
): MarketplaceLedgerEntry {
  const row =
    asRecord(value);

  const entryType =
    asString(
      row.entryType,
      "revenue",
    );

  return {
    id:
      asString(
        row.id,
      ),

    paymentId:
      asNullableString(
        row.paymentId,
      ),

    entryType:
      entryType === "expense"
        ? "expense"
        : "revenue",

    amount:
      asNumber(
        row.amount,
      ),

    currency:
      asString(
        row.currency,
        "MGA",
      ),

    occurredAt:
      asString(
        row.occurredAt,
      ),

    description:
      asString(
        row.description,
        "Écriture Marketplace",
      ),

    reference:
      asNullableString(
        row.reference,
      ),

    sourceId:
      asNullableString(
        row.sourceId,
      ),

    orderId:
      asNullableString(
        row.orderId,
      ),

    paymentMethod:
      asNullableString(
        row.paymentMethod,
      ),

    providerReference:
      asNullableString(
        row.providerReference,
      ),
  };
}

export class SellerMarketplaceRepository {
  private readonly client:
    RpcClient;

  constructor() {
    this.client =
      createSupabaseBrowserClient() as unknown as RpcClient;
  }

  async snapshot(
    from: string,
    to: string,
    periodDays: number,
  ): Promise<SellerMarketplaceSnapshot> {
    const [
      performanceResult,
      revenueResult,
    ] =
      await Promise.all([
        this.client.rpc(
          "marketplace_seller_performance_snapshot",
          {
            p_from: from,
            p_to: to,
          },
        ),

        this.client.rpc(
          "marketplace_seller_revenue_snapshot",
        ),
      ]);

    if (
      performanceResult.error
    ) {
      throw new Error(
        performanceResult.error.message,
      );
    }

    if (
      revenueResult.error
    ) {
      throw new Error(
        revenueResult.error.message,
      );
    }

    const performancePayload =
      asRecord(
        performanceResult.data,
      );

    const revenuePayload =
      asRecord(
        revenueResult.data,
      );

    const performance:
      MarketplacePerformanceSnapshot = {
        organizationId:
          asString(
            performancePayload.organizationId,
          ),

        from:
          asString(
            performancePayload.from,
            from,
          ),

        to:
          asString(
            performancePayload.to,
            to,
          ),

        orders:
          asNumber(
            performancePayload.orders,
          ),

        paidOrders:
          asNumber(
            performancePayload.paidOrders,
          ),

        customers:
          asNumber(
            performancePayload.customers,
          ),

        repeatCustomers:
          asNumber(
            performancePayload.repeatCustomers,
          ),

        carts:
          asNumber(
            performancePayload.carts,
          ),

        convertedCarts:
          asNumber(
            performancePayload.convertedCarts,
          ),

        abandonedCarts:
          asNumber(
            performancePayload.abandonedCarts,
          ),

        conversionRate:
          asNumber(
            performancePayload.conversionRate,
          ),

        currencies:
          asRows(
            performancePayload.currencies,
          ).map(
            mapCurrency,
          ),

        products:
          asRows(
            performancePayload.products,
          ).map(
            mapProduct,
          ),

        customersRanking:
          asRows(
            performancePayload.customersRanking,
          ).map(
            mapCustomer,
          ),
      };

    return {
      generatedAt:
        new Date().toISOString(),

      periodDays,

      performance,

      ledger: {
        organizationId:
          asString(
            revenuePayload.organizationId,
          ),

        currencies:
          asRows(
            revenuePayload.currencies,
          ).map(
            mapLedgerCurrency,
          ),

        entries:
          asRows(
            revenuePayload.entries,
          )
            .map(
              mapLedgerEntry,
            )
            .slice(
              0,
              12,
            ),
      },
    };
  }
}