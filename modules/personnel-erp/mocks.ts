import type { PersonnelMockData } from './types';

export function createPersonnelMock(organizationName: string): PersonnelMockData {
  return {
    organizationName,
    members: [
      { id: 'p-001', name: 'Mialy Rakoto', handle: '@mialy.rakoto', email: 'mialy@indesy.mg', phone: '+261 34 12 345 67', role: 'Responsable des opérations', department: 'Opérations', contract: 'CDI', location: 'Antananarivo', status: 'Actif', joinedAt: '12 janvier 2024', availability: 'Disponible', monthlyCompensation: 2800000 },
      { id: 'p-002', name: 'Hery Andrianina', handle: '@hery.andrianina', email: 'hery@indesy.mg', phone: '+261 33 45 612 08', role: 'Coordinateur sportif', department: 'Sport', contract: 'CDD', location: 'Mahajanga', status: 'Actif', joinedAt: '3 mars 2025', availability: 'Mission terrain', monthlyCompensation: 2200000 },
      { id: 'p-003', name: 'Voahirana Rasoanaivo', handle: '@voahirana.r', email: 'voahirana@indesy.mg', phone: '+261 32 78 410 22', role: 'Responsable finance', department: 'Finance', contract: 'CDI', location: 'Antananarivo', status: 'Actif', joinedAt: '18 août 2023', availability: 'Disponible', monthlyCompensation: 3100000 },
      { id: 'p-004', name: 'Toky Randria', handle: '@toky.randria', email: 'toky@indesy.mg', phone: '+261 34 90 011 42', role: 'Chargé de communication', department: 'Communication', contract: 'Freelance', location: 'Toamasina', status: 'En congé', joinedAt: '7 octobre 2025', availability: 'Retour le 18 août', monthlyCompensation: 1600000 },
      { id: 'p-005', name: 'Fara Razafindrakoto', handle: '@fara.razafy', email: 'fara@indesy.mg', phone: '+261 33 16 008 64', role: 'Assistante administrative', department: 'Administration', contract: 'CDD', location: 'Antananarivo', status: 'Actif', joinedAt: '22 avril 2026', availability: 'Disponible', monthlyCompensation: 1450000 },
      { id: 'p-006', name: 'Nomena Ratsimba', handle: '@nomena.ratsimba', email: 'nomena@indesy.mg', phone: '+261 32 55 821 19', role: 'Agent logistique', department: 'Logistique', contract: 'Vacation', location: 'Mahajanga', status: 'Invité', joinedAt: '—', availability: 'À confirmer', monthlyCompensation: 900000 },
    ],
    invitations: [
      { id: 'i-001', recipient: '@nomena.ratsimba', email: 'nomena@indesy.mg', role: 'Agent logistique', sentAt: '12 août 2026 · 09:14', expiresAt: '19 août 2026', status: 'En attente' },
      { id: 'i-002', recipient: '@sahondra.med', email: 'sahondra@indesy.mg', role: 'Référente médicale', sentAt: '11 août 2026 · 16:42', expiresAt: '18 août 2026', status: 'En attente' },
      { id: 'i-003', recipient: '@tiana.security', email: 'tiana@indesy.mg', role: 'Responsable sécurité', sentAt: '8 août 2026 · 10:08', expiresAt: '15 août 2026', status: 'Acceptée' },
      { id: 'i-004', recipient: '@lanto.ops', email: 'lanto@indesy.mg', role: 'Assistant opérations', sentAt: '1 août 2026 · 08:30', expiresAt: '8 août 2026', status: 'Expirée' },
    ],
    assignments: [
      { id: 'a-001', member: 'Mialy Rakoto', mission: 'Direction opérationnelle', scope: 'Mahajanga Fight Night Vol.3', startsAt: '28 août · 08:00', endsAt: '31 août · 18:00', status: 'Planifiée' },
      { id: 'a-002', member: 'Hery Andrianina', mission: 'Coordination Fight Card', scope: 'Mahajanga Fight Night Vol.3', startsAt: '29 août · 09:00', endsAt: '30 août · 23:30', status: 'Planifiée' },
      { id: 'a-003', member: 'Voahirana Rasoanaivo', mission: 'Clôture billetterie', scope: 'Finance événement', startsAt: '12 août · 08:00', endsAt: '30 août · 23:59', status: 'En cours' },
      { id: 'a-004', member: 'Fara Razafindrakoto', mission: 'Accréditations équipe', scope: 'Accueil & administration', startsAt: '10 août · 08:00', endsAt: '27 août · 17:00', status: 'En cours' },
    ],
    leaves: [
      { id: 'l-001', member: 'Toky Randria', type: 'Congé annuel', period: '12–17 août 2026', days: 4, status: 'Approuvé' },
      { id: 'l-002', member: 'Fara Razafindrakoto', type: 'Permission', period: '21 août 2026', days: 1, status: 'À valider' },
      { id: 'l-003', member: 'Hery Andrianina', type: 'Récupération', period: '2–3 septembre 2026', days: 2, status: 'À valider' },
    ],
    documents: [
      { id: 'd-001', member: 'Mialy Rakoto', name: 'Contrat de travail', category: 'Contrat', expiresAt: '31 décembre 2027', status: 'Valide' },
      { id: 'd-002', member: 'Hery Andrianina', name: 'Certification encadrement', category: 'Certification', expiresAt: '30 septembre 2026', status: 'Expire bientôt' },
      { id: 'd-003', member: 'Toky Randria', name: 'Accord de confidentialité', category: 'Conformité', expiresAt: 'Permanent', status: 'Valide' },
      { id: 'd-004', member: 'Nomena Ratsimba', name: 'Pièce d’identité', category: 'Identité', expiresAt: '—', status: 'Manquant' },
    ],
  };
}
