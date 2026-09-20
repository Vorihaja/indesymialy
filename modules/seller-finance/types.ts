export type SellerTransactionType =
  | "charge"
  | "refund"
  | "deposit"
  | "deposit_release";

export type SellerTransactionStatus =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled";

export type SellerPaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled";

export type SellerPaymentMethod =
  | "cash"
  | "mobile_money"
  | "card"
  | "bank_transfer";

export interface SellerFinanceTransaction {
  id: string;
  orderId: string;
  type: SellerTransactionType;
  status: SellerTransactionStatus;
  amount: number;
  currency: string;
  externalReference: string | null;
  createdAt: string;

  paymentId: string | null;
  paymentMethod: SellerPaymentMethod | null;
  paymentStatus: SellerPaymentStatus | null;
  providerReference: string | null;
  paidAt: string | null;
}

export interface SellerRevenueCurrency {
  currency: string;
  revenue: number;
  expense: number;
  net: number;
}

export interface SellerRevenueEntry {
  id: string;
  paymentId: string;
  entryType: "revenue" | "expense";
  amount: number;
  currency: string;
  occurredAt: string;
  description: string;
  reference: string | null;
  sourceId: string | null;
  orderId: string | null;
  paymentMethod: SellerPaymentMethod | null;
  providerReference: string | null;
}

export interface SellerRevenueSnapshot {
  organizationId: string;
  currencies: SellerRevenueCurrency[];
  entries: SellerRevenueEntry[];
}