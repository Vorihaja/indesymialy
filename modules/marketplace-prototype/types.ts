export type MarketProductType = 'sale' | 'rental' | 'used' | 'service';
export type MarketProduct = {
  id: string; title: string; category: string; discipline: string; brand: string; type: MarketProductType;
  condition: string; price: number; compareAt?: number; rentalPrice?: number; deposit?: number; stock: number;
  seller: string; sellerHandle: string; location: string; rating: number; reviews: number; featured?: boolean;
  accent: 'red' | 'blue' | 'amber' | 'green'; description: string; specs: string[]; variants: string[];
  serviceDuration?: string; serviceFormat?: 'Présentiel' | 'En ligne' | 'Hybride'; bookingRequired?: boolean;
  sellerVerified?: boolean; sellerVerificationLabel?: string; sellerCommissionRate?: number;
};
export type MarketCartLine = { id: string; productId: string; quantity: number; variant: string; mode: 'sale' | 'rental'; startDate?: string; endDate?: string };
export type MarketOrder = { id: string; date: string; total: number; status: 'Confirmée' | 'Préparation' | 'Expédiée' | 'Livrée'; lines: MarketCartLine[]; delivery: string; payment: string };
