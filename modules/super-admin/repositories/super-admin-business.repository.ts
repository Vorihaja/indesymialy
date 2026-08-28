import {
  supabase,
} from "@/lib/supabase";

import type {
  SuperAdminBusinessAnalytics,
  SuperAdminBusinessBreakdown,
  SuperAdminBusinessCurrency,
  SuperAdminBusinessDailyPoint,
} from "../business.types";

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
): SuperAdminBusinessBreakdown[] {
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

        units:
          row.units === undefined
            ? undefined
            : number(
                row.units,
              ),

        contracts:
          row.contracts === undefined
            ? undefined
            : number(
                row.contracts,
              ),
      };
    },
  );
}

function currencies(
  value: unknown,
): SuperAdminBusinessCurrency[] {
  return array(value).map(
    (item) => {
      const row =
        record(item);

      return {
        currency:
          text(
            row.currency,
          ),

        marketplace:
          number(
            row.marketplace,
          ),

        ticketing:
          number(
            row.ticketing,
          ),

        sponsorship:
          number(
            row.sponsorship,
          ),

        total:
          number(
            row.total,
          ),
      };
    },
  );
}

function dailySeries(
  value: unknown,
): SuperAdminBusinessDailyPoint[] {
  return array(value).map(
    (item) => {
      const row =
        record(item);

      return {
        date:
          text(
            row.date,
          ),

        marketplace:
          number(
            row.marketplace,
          ),

        ticketing:
          number(
            row.ticketing,
          ),

        sponsorship:
          number(
            row.sponsorship,
          ),

        total:
          number(
            row.total,
          ),
      };
    },
  );
}

export class SuperAdminBusinessRepository {

  async getAnalytics(
    from: Date,
    to: Date,
  ): Promise<SuperAdminBusinessAnalytics> {

    const {
      data,
      error,
    } = await supabase.rpc(
      "super_admin_business_analytics",
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

        businessVolume:
          number(
            headline.businessVolume,
          ),

        businessVolumeGrowth:
          nullableNumber(
            headline.businessVolumeGrowth,
          ),

        marketplaceGmv:
          number(
            headline.marketplaceGmv,
          ),

        ticketingRevenue:
          number(
            headline.ticketingRevenue,
          ),

        sponsorshipValue:
          number(
            headline.sponsorshipValue,
          ),

        marketplacePaidOrders:
          number(
            headline.marketplacePaidOrders,
          ),

        ticketTransactions:
          number(
            headline.ticketTransactions,
          ),

        ticketUnits:
          number(
            headline.ticketUnits,
          ),

        paidSponsorContracts:
          number(
            headline.paidSponsorContracts,
          ),

        activeSubscriptions:
          number(
            headline.activeSubscriptions,
          ),

        financialPayments:
          number(
            headline.financialPayments,
          ),

        ticketSalesWithoutCurrency:
          number(
            headline.ticketSalesWithoutCurrency,
          ),
      },


      breakdowns: {

        sources:
          breakdown(
            breakdowns.sources,
          ),

        currencies:
          currencies(
            breakdowns.currencies,
          ),

        subscriptionPlans:
          breakdown(
            breakdowns.subscriptionPlans,
          ),

        financialSources:
          breakdown(
            breakdowns.financialSources,
          ),

        financialStatuses:
          breakdown(
            breakdowns.financialStatuses,
          ),

        topEvents:
          breakdown(
            breakdowns.topEvents,
          ),

        topSponsors:
          breakdown(
            breakdowns.topSponsors,
          ),
      },


      dailySeries:
        dailySeries(
          root.dailySeries,
        ),
    };
  }
}
