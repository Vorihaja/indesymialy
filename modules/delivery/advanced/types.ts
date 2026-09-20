import type {
  GeographyValue,
} from "@/modules/geography/types";


export type DeliveryCarrierStatus =
  | "active"
  | "inactive"
  | "archived";


export type DeliveryZoneStatus =
  | "active"
  | "inactive"
  | "archived";


export type MarketplaceReturnStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "received"
  | "resolved"
  | "cancelled";


export type MarketplaceReturnResolution =
  | "refund"
  | "exchange"
  | "store_credit"
  | "none";


export type MarketplaceReturnItemCondition =
  | "unopened"
  | "good"
  | "damaged"
  | "defective"
  | "other";


export interface DeliveryAssignment {
  id: string;
  orderId: string;
  method: string;
  address: string | null;
  status: string;
  carrierId: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  updatedAt: string;
}


export interface DeliveryCarrier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  trackingUrlTemplate: string | null;
  notes: string | null;
  status: DeliveryCarrierStatus;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}


export interface DeliveryCarrierInput {
  id?: string | null;
  name: string;
  phone: string;
  email: string;
  website: string;
  trackingUrlTemplate: string;
  notes: string;
  status: "active" | "inactive";
}


export interface DeliveryZoneArea {
  id: string;
  regionId: string | null;
  districtId: string | null;
  cityId: string | null;
  communeId: string | null;
}


export interface DeliveryZone {
  id: string;
  name: string;
  deliveryFee: number;
  currency: string;
  minDeliveryDays: number;
  maxDeliveryDays: number;
  freeDeliveryThreshold: number | null;
  status: DeliveryZoneStatus;
  createdAt: string;
  updatedAt: string;
  areas: DeliveryZoneArea[];
}


export interface DeliveryZoneInput {
  id?: string | null;
  name: string;
  deliveryFee: number;
  currency: string;
  minDeliveryDays: number;
  maxDeliveryDays: number;
  freeDeliveryThreshold: number | null;
  status: "active" | "inactive";
  areas: GeographyValue[];
}


export interface MarketplaceReturnItem {
  id: string;
  orderLineId: string;
  productId: string;
  productTitle: string;
  quantity: number;
  condition: MarketplaceReturnItemCondition;
  note: string | null;
}


export interface MarketplaceReturnHistory {
  id: string;
  fromStatus: MarketplaceReturnStatus | null;
  toStatus: MarketplaceReturnStatus;
  note: string | null;
  createdAt: string;
}


export interface MarketplaceReturn {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  currency: string;
  reason: string;
  status: MarketplaceReturnStatus;
  resolution: MarketplaceReturnResolution | null;
  requestedAt: string;
  receivedAt: string | null;
  resolvedAt: string | null;
  updatedAt: string;
  items: MarketplaceReturnItem[];
  history: MarketplaceReturnHistory[];
}


export interface ReturnCandidateLine {
  id: string;
  productId: string;
  productTitle: string;
  quantity: number;
  unitPrice: number;
}


export interface ReturnCandidateOrder {
  id: string;
  customerName: string;
  currency: string;
  total: number;
  createdAt: string;
  lines: ReturnCandidateLine[];
}


export interface CreateReturnItemInput {
  orderLineId: string;
  quantity: number;
  condition: MarketplaceReturnItemCondition;
  note: string;
}


export interface CreateReturnInput {
  orderId: string;
  reason: string;
  items: CreateReturnItemInput[];
}


export interface DeliveryAdvancedSnapshot {
  organizationId: string;
  deliveries: DeliveryAssignment[];
  carriers: DeliveryCarrier[];
  zones: DeliveryZone[];
  returns: MarketplaceReturn[];
  returnCandidateOrders: ReturnCandidateOrder[];
}