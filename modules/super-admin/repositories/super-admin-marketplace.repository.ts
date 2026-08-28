import {
  supabase,
} from "@/lib/supabase";

import type {
  SuperAdminMarketplaceAnalytics,
  SuperAdminMarketplaceBreakdown,
  SuperAdminMarketplaceCurrency,
  SuperAdminMarketplaceDailyPoint,
} from "../marketplace.types";

type JsonRecord =
  Record<string, unknown>;

function record(
  value: unknown,
): JsonRecord {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
    ? value as JsonRecord
    : {};
}

function array(
  value: unknown,
): unknown[] {
  return Array.isArray(value)
    ? value
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
  return typeof value === "string"
    ? value
    : null;
}

function number(
  value: unknown,
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function nullableNumber(
  value: unknown,
): number | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return number(value);
}

function breakdown(
  value: unknown,
): SuperAdminMarketplaceBreakdown[] {
  return array(value).map(
    (item) => {
      const row =
        record(item);

      return {
        label:
          text(
            row.label,
            "Sans libellé",
          ),

        value:
          number(
            row.value,
          ),

        amount:
          row.amount === undefined
            ? undefined
            : number(
                row.amount,
              ),

        currency:
          nullableText(
            row.currency,
          ) ?? undefined,

        id:
          nullableText(
            row.id,
          ) ?? undefined,

        orders:
          row.orders === undefined
            ? undefined
            : number(
                row.orders,
              ),

        units:
          row.units === undefined
            ? undefined
            : number(
                row.units,
              ),
      };
    },
  );
}

function currencies(
  value: unknown,
): SuperAdminMarketplaceCurrency[] {
  return array(value).map(
    (item) => {
      const row =
        record(item);

      return {
        currency:
          text(
            row.currency,
          ),

        orders:
          number(
            row.orders,
          ),

        gmv:
          number(
            row.gmv,
          ),
      };
    },
  );
}

function dailySeries(
  value: unknown,
): SuperAdminMarketplaceDailyPoint[] {
  return array(value).map(
    (item) => {
      const row =
        record(item);

      return {
        date:
          text(
            row.date,
          ),

        orders:
          number(
            row.orders,
          ),

        paidOrders:
          number(
            row.paidOrders,
          ),

        gmv:
          number(
            row.gmv,
          ),
      };
    },
  );
}

export class SuperAdminMarketplaceRepository {

  async getAnalytics(
    from: Date,
    to: Date,
  ): Promise<SuperAdminMarketplaceAnalytics> {

    const {
      data,
      error,
    } = await supabase.rpc(
      "super_admin_marketplace_analytics",
      {
        p_from:
          from.toISOString(),

        p_to:
          to.toISOString(),
      },
    );

    if (error) {
      throw new Error(
        error.message,
      );
    }

    const root =
      record(data);

    const period =
      record(
        root.period,
      );

    const headline =
      record(
        root.headline,
      );

    const funnel =
      record(
        root.funnel,
      );

    const commerce =
      record(
        root.commerce,
      );

    const breakdowns =
      record(
        root.breakdowns,
      );

    return {

      period: {
        from:
          text(
            period.from,
          ),

        to:
          text(
            period.to,
          ),

        previousFrom:
          text(
            period.previousFrom,
          ),

        previousTo:
          text(
            period.previousTo,
          ),
      },


      headline: {

        primaryCurrency:
          nullableText(
            headline.primaryCurrency,
          ),

        gmv:
          number(
            headline.gmv,
          ),

        gmvGrowth:
          nullableNumber(
            headline.gmvGrowth,
          ),

        orders:
          number(
            headline.orders,
          ),

        ordersGrowth:
          nullableNumber(
            headline.ordersGrowth,
          ),

        paidOrders:
          number(
            headline.paidOrders,
          ),

        paymentSuccessRate:
          number(
            headline.paymentSuccessRate,
          ),

        averageOrderValue:
          number(
            headline.averageOrderValue,
          ),

        buyers:
          number(
            headline.buyers,
          ),

        repeatBuyerRate:
          number(
            headline.repeatBuyerRate,
          ),

        sellers:
          number(
            headline.sellers,
          ),

        products:
          number(
            headline.products,
          ),

        publishedProducts:
          number(
            headline.publishedProducts,
          ),

        productsAdded:
          number(
            headline.productsAdded,
          ),

        lowStock:
          number(
            headline.lowStock,
          ),

        outOfStock:
          number(
            headline.outOfStock,
          ),

        favorites:
          number(
            headline.favorites,
          ),

        favoritesAdded:
          number(
            headline.favoritesAdded,
          ),

        activeCarts:
          number(
            headline.activeCarts,
          ),
      },


      funnel: {

        cartsCreated:
          number(
            funnel.cartsCreated,
          ),

        checkoutGroups:
          number(
            funnel.checkoutGroups,
          ),

        orders:
          number(
            funnel.orders,
          ),

        paidOrders:
          number(
            funnel.paidOrders,
          ),

        checkoutRate:
          number(
            funnel.checkoutRate,
          ),
      },


      commerce: {

        saleUnits:
          number(
            commerce.saleUnits,
          ),

        rentalUnits:
          number(
            commerce.rentalUnits,
          ),

        activeRentals:
          number(
            commerce.activeRentals,
          ),

        returnedRentals:
          number(
            commerce.returnedRentals,
          ),

        availableUnits:
          number(
            commerce.availableUnits,
          ),

        reservedUnits:
          number(
            commerce.reservedUnits,
          ),

        fees:
          number(
            commerce.fees,
          ),

        deliveryCompletionRate:
          number(
            commerce.deliveryCompletionRate,
          ),
      },


      breakdowns: {

        orderStatuses:
          breakdown(
            breakdowns.orderStatuses,
          ),

        listingTypes:
          breakdown(
            breakdowns.listingTypes,
          ),

        categories:
          breakdown(
            breakdowns.categories,
          ),

        paymentMethods:
          breakdown(
            breakdowns.paymentMethods,
          ),

        paymentStatuses:
          breakdown(
            breakdowns.paymentStatuses,
          ),

        topSellers:
          breakdown(
            breakdowns.topSellers,
          ),

        topProducts:
          breakdown(
            breakdowns.topProducts,
          ),

        transactionTypes:
          breakdown(
            breakdowns.transactionTypes,
          ),

        currencies:
          currencies(
            breakdowns.currencies,
          ),
      },


      dailySeries:
        dailySeries(
          root.dailySeries,
        ),
    };
  }
}
