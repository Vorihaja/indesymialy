import type { ErpListing, ErpMarketplaceRole } from './types';

export const roleSellerProfiles: Record<ErpMarketplaceRole, { name: string; handle: string; specialty: string }> = {
  'super-admin': { name: 'Indesy Mialy', handle: '@indesy.mialy', specialty: 'Services plateforme' },
  admin: { name: 'Administration Indesy', handle: '@indesy.admin', specialty: 'Accompagnement' },
  federation: { name: 'Fédération Malagasy', handle: '@federation.mma', specialty: 'Formations officielles' },
  league: { name: 'Ligue Analamanga', handle: '@ligue.analamanga', specialty: 'Séminaires régionaux' },
  club: { name: 'Boeny Fight Club', handle: '@boeny.fight', specialty: 'Stages & équipements' },
  coach: { name: 'Coach Hery', handle: '@coach.hery', specialty: 'Coaching sportif' },
  fighter: { name: 'Tiana Rakoto', handle: '@tiana.rakoto', specialty: 'Masterclass & merchandising' },
  organizer: { name: 'Mialy Events', handle: '@mialy.events', specialty: 'Billetterie & production' },
  referee: { name: 'Feno R.', handle: '@arbitre.feno', specialty: 'Séminaires arbitrage' },
  judge: { name: 'Miora R.', handle: '@juge.miora', specialty: 'Formation scoring' },
  sponsor: { name: 'Boeny Nutrition', handle: '@boeny.nutrition', specialty: 'Nutrition & activation' },
  seller: { name: 'Combat Store Madagascar', handle: '@combat.store', specialty: 'Équipement sportif' },
  fan: { name: 'Compte Supporter', handle: '@supporter.mialy', specialty: 'Articles d’occasion' },
};

export function getErpMarketplaceMock(role: ErpMarketplaceRole): ErpListing[] {
  const seller = roleSellerProfiles[role];
  return [
    { id: `${role}-service-1`, title: `${seller.specialty} · Offre découverte`, category: 'Services', discipline: 'Multisport', brand: seller.name, type: 'service', condition: 'Réservation', price: role === 'fan' ? 35000 : 180000, stock: 12, seller: seller.name, sellerHandle: seller.handle, location: 'Madagascar', rating: 4.8, reviews: 18, accent: 'blue', description: 'Une prestation proposée par un acteur vérifié de l’écosystème Indesy Mialy.', specs: ['Accompagnement personnalisé', 'Compte rendu inclus', 'Réservation confirmée'], variants: ['Formule standard', 'Formule premium'], serviceDuration: '90 minutes', serviceFormat: 'Hybride', bookingRequired: true, status: 'Publié', views: 428, orders: 12, revenue: 2160000, updatedAt: '12 août 2026 · 09:42' },
    { id: `${role}-draft-1`, title: `Nouvelle offre ${seller.specialty.toLowerCase()}`, category: 'Services', discipline: 'Tous sports', brand: seller.name, type: 'service', condition: 'Réservation', price: 95000, stock: 8, seller: seller.name, sellerHandle: seller.handle, location: 'À définir', rating: 0, reviews: 0, accent: 'green', description: 'Description à compléter avant publication.', specs: ['Programme à finaliser'], variants: ['Standard'], serviceDuration: '60 minutes', serviceFormat: 'Présentiel', bookingRequired: true, status: 'Brouillon', views: 0, orders: 0, revenue: 0, updatedAt: '11 août 2026 · 16:18' },
  ];
}

export const marketplaceOrders = [
  ['CMD-2094', '@rakoto.tiana', 'Offre découverte', '1', '180 000 Ar', 'Confirmée'],
  ['CMD-2081', '@club.boeny', 'Formule premium', '2', '360 000 Ar', 'À planifier'],
  ['CMD-2058', '@miora.r', 'Offre découverte', '1', '180 000 Ar', 'Terminée'],
  ['CMD-2029', '@fan.mialy', 'Formule standard', '1', '95 000 Ar', 'Annulée'],
];
