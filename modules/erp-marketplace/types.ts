import type { MarketProduct, MarketProductType } from '@/modules/marketplace-prototype/types';

export type ErpMarketplaceRole =
  | 'super-admin' | 'admin' | 'federation' | 'league' | 'club' | 'coach'
  | 'fighter' | 'organizer' | 'referee' | 'judge' | 'sponsor' | 'seller' | 'fan';

export type ListingStatus = 'Publié' | 'Brouillon' | 'En révision' | 'Archivé';
export type ErpListing = MarketProduct & { status: ListingStatus; views: number; orders: number; revenue: number; updatedAt: string };
export type VerificationStatus = 'Non vérifié' | 'En révision' | 'Vérifié' | 'À renouveler';
export type VerificationDocumentStatus = 'Manquant' | 'Ajouté' | 'Validé' | 'Refusé';
export type VerificationDocument = { id: string; label: string; required: boolean; status: VerificationDocumentStatus; fileName?: string; expiresAt?: string };

export type ListingForm = {
  id?: string; type: MarketProductType; title: string; category: string; discipline: string;
  description: string; price: string; compareAt: string; stock: string; condition: string;
  brand: string; location: string; variants: string; specifications: string;
  serviceDuration: string; serviceFormat: 'Présentiel' | 'En ligne' | 'Hybride';
  bookingRequired: boolean; availabilityDate: string; availabilityTime: string;
  delivery: string; cancellation: string;
};
