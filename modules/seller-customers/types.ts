export type CustomerCurrencyTotal = {
  currency: string;
  orders: number;
  paidOrders: number;
  paidSubtotal: number;
  paidTotal: number;
};

export type SellerCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  firstOrderAt: string;
  lastOrderAt: string;
  orders: number;
  paidOrders: number;
  loyaltyPoints: number;
  segmentIds: string[];
  totalsByCurrency: CustomerCurrencyTotal[];
};

export type CustomerSegment = {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "archived";
  customerIds: string[];
  createdAt: string;
};

export type LoyaltyEntry = {
  id: string;
  customerId: string;
  points: number;
  reason: string;
  orderId: string | null;
  createdAt: string;
};

export type CustomerDisputeStatus =
  | "open"
  | "in_review"
  | "resolved"
  | "closed";

export type CustomerDispute = {
  id: string;
  customerId: string;
  orderId: string | null;
  subject: string;
  description: string | null;
  status: CustomerDisputeStatus;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SellerCustomerOrder = {
  id: string;
  customerId: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
  createdAt: string;
};

export type SellerCustomersSnapshot = {
  organizationId: string;
  customers: SellerCustomer[];
  segments: CustomerSegment[];
  loyalty: LoyaltyEntry[];
  disputes: CustomerDispute[];
  recentOrders: SellerCustomerOrder[];
};

export type CustomerSegmentInput = {
  id?: string | null;
  name: string;
  description?: string | null;
};

export type LoyaltyAdjustmentInput = {
  customerId: string;
  points: number;
  reason: string;
  orderId?: string | null;
};

export type CustomerDisputeInput = {
  id?: string | null;
  customerId: string;
  orderId?: string | null;
  subject: string;
  description?: string | null;
  status: CustomerDisputeStatus;
  resolution?: string | null;
};