'use client';

import {
  SellerCommissionsFeature,
  SellerFinanceSummaryFeature,
  SellerPayoutsFeature,
  SellerRevenueFeature,
  SellerTransactionsFeature,
} from '@/modules/seller-finance';

export type SellerFinanceAdapterView =
  | 'summary'
  | 'revenue'
  | 'transactions'
  | 'commissions'
  | 'settlements';

export function SellerFinanceAdapter({
  view,
}: {
  view: SellerFinanceAdapterView;
}) {
  switch (view) {
    case 'summary':
      return <SellerFinanceSummaryFeature />;

    case 'revenue':
      return <SellerRevenueFeature />;

    case 'commissions':
      return <SellerCommissionsFeature />;

    case 'settlements':
      return <SellerPayoutsFeature />;

    case 'transactions':
      return <SellerTransactionsFeature />;
  }
}