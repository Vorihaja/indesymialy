export type PromotionDiscountType =
  | "percent"
  | "fixed";

export type PromotionStatus =
  | "draft"
  | "active"
  | "paused"
  | "archived";

export type PromotionCodeStatus =
  | "active"
  | "inactive";

export interface PromotionProduct {
  id: string;
  name: string;
}

export interface PromotionCampaign {
  id: string;
  sellerOrganizationId: string;
  name: string;
  description: string | null;
  discountType: PromotionDiscountType;
  discountValue: number;
  currency: string;
  status: PromotionStatus;
  startsAt: string | null;
  endsAt: string | null;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usageCount: number;
  productIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PromotionCode {
  id: string;
  promotionId: string;
  code: string;
  status: PromotionCodeStatus;
  usageLimit: number | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionsSnapshot {
  organizationId: string;
  campaigns: PromotionCampaign[];
  codes: PromotionCode[];
  products: PromotionProduct[];
}

export interface PromotionCampaignInput {
  id?: string;
  name: string;
  description: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  currency: string;
  status: PromotionStatus;
  startsAt: string | null;
  endsAt: string | null;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  productIds: string[];
}

export interface PromotionCodeInput {
  id?: string;
  promotionId: string;
  code: string;
  status: PromotionCodeStatus;
  usageLimit: number | null;
}