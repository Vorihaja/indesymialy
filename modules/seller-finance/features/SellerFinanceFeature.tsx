"use client";

import {
  SellerCommissionsFeature,
} from "./SellerCommissionsFeature";

import {
  SellerFinanceSummaryFeature,
} from "./SellerFinanceSummaryFeature";

import {
  SellerPayoutsFeature,
} from "./SellerPayoutsFeature";

import {
  SellerRevenueFeature,
} from "./SellerRevenueFeature";

import {
  SellerTransactionsFeature,
} from "./SellerTransactionsFeature";


export function SellerFinanceFeature({
  tab,
}: {
  tab?: string;
}) {
  switch (tab) {
    case "Revenus":
      return <SellerRevenueFeature />;

    case "Transactions":
      return <SellerTransactionsFeature />;

    case "Commissions":
      return <SellerCommissionsFeature />;

    case "Versements":
      return <SellerPayoutsFeature />;

    case "Synthèse":
    default:
      return <SellerFinanceSummaryFeature />;
  }
}