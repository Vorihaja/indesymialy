export type BundlePricingMode =
  | "fixed_price"
  | "percent_discount";


export type PromotionV2Status =
  | "draft"
  | "active"
  | "paused"
  | "archived";


export type PartnershipType =
  | "affiliate"
  | "co_marketing"
  | "sponsorship"
  | "supplier"
  | "ambassador"
  | "distribution"
  | "other";


export type PartnershipBenefitType =
  | "percent_discount"
  | "fixed_discount"
  | "promotion_code"
  | "visibility"
  | "other";


export interface PromotionV2Product {
  id: string;
  name: string;
  price: number;
  listingType: string;
  status: string;
}


export interface PromotionV2Organization {
  id: string;
  name: string;
  type: string;
  status: string;
}


export interface MarketplaceBundleItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  sortOrder: number;
}


export interface MarketplaceBundle {
  id: string;
  name: string;
  description: string | null;
  pricingMode: BundlePricingMode;
  fixedPrice: number | null;
  discountPercent: number | null;
  currency: string;
  status: PromotionV2Status;
  startsAt: string | null;
  endsAt: string | null;
  originalPrice: number;
  previewPrice: number;
  items: MarketplaceBundleItem[];
  createdAt: string;
  updatedAt: string;
}


export interface MarketplaceBundleInput {
  id?: string;
  name: string;
  description: string;
  pricingMode: BundlePricingMode;
  fixedPrice: number | null;
  discountPercent: number | null;
  currency: string;
  status: Exclude<
    PromotionV2Status,
    "archived"
  >;
  startsAt: string | null;
  endsAt: string | null;
  items: Array<{
    productId: string;
    quantity: number;
    sortOrder: number;
  }>;
}


export interface PartnershipHistoryEntry {
  id: string;
  fromStatus: PromotionV2Status | null;
  toStatus: PromotionV2Status;
  note: string | null;
  createdAt: string;
}


export interface MarketplacePartnership {
  id: string;
  partnerOrganizationId: string | null;
  partnerName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  partnershipType: PartnershipType;
  description: string | null;
  benefitType: PartnershipBenefitType;
  benefitValue: number | null;
  currency: string;
  promotionCode: string | null;
  status: PromotionV2Status;
  startsAt: string | null;
  endsAt: string | null;
  productIds: string[];
  history: PartnershipHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}


export interface MarketplacePartnershipInput {
  id?: string;
  partnerOrganizationId: string | null;
  partnerName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  partnershipType: PartnershipType;
  description: string;
  benefitType: PartnershipBenefitType;
  benefitValue: number | null;
  currency: string;
  promotionCode: string;
  status: Exclude<
    PromotionV2Status,
    "archived"
  >;
  startsAt: string | null;
  endsAt: string | null;
  productIds: string[];
}


export interface PromotionsV2Snapshot {
  organizationId: string;
  products: PromotionV2Product[];
  organizations: PromotionV2Organization[];
  bundles: MarketplaceBundle[];
  partnerships: MarketplacePartnership[];
}