import type { ErpCalendarEvent, ErpCalendarRole } from '../types';

const roleContexts: Record<ErpCalendarRole, { owner: string; items: Array<[string, string, string, ErpCalendarEvent['type'], string]> }> = {
  'super-admin': { owner: 'Exploitation plateforme', items: [['Comité sécurité plateforme', '2026-08-13', '09:00', 'meeting', 'Visioconférence'], ['Maintenance programmée', '2026-08-15', '02:00', 'deadline', 'Infrastructure'], ['Revue trimestrielle', '2026-08-21', '14:00', 'meeting', 'Direction']] },
  admin: { owner: 'Administration Indesy Mialy', items: [['Revue des signalements', '2026-08-13', '10:00', 'meeting', 'Administration'], ['Validation Fédération Atsinanana', '2026-08-17', '09:30', 'deadline', 'Bureau conformité'], ['Point support', '2026-08-20', '15:00', 'meeting', 'Visioconférence']] },
  federation: { owner: 'Fédération nationale', items: [['Commission licences', '2026-08-14', '09:00', 'meeting', 'Siège fédéral'], ['Championnat Madagascar MMA', '2026-08-18', '08:00', 'sport', 'Palais des Sports'], ['Clôture des inscriptions', '2026-08-24', '18:00', 'deadline', 'En ligne']] },
  league: { owner: 'Ligue Analamanga', items: [['Réunion des clubs', '2026-08-13', '17:30', 'meeting', 'Maison des Sports'], ['Open Analamanga Combat', '2026-08-22', '09:00', 'sport', 'Gymnase Mahamasina'], ['Affectation des officiels', '2026-08-26', '14:00', 'deadline', 'Bureau Ligue']] },
  club: { owner: 'Boeny Fight Club', items: [['Entraînement compétition', '2026-08-12', '18:00', 'sport', 'Dojo principal'], ['Pesée interne', '2026-08-15', '08:30', 'medical', 'Salle médicale'], ['Déplacement équipe MFN', '2026-08-28', '06:00', 'travel', 'Parking du club']] },
  coach: { owner: 'Planning du coach', items: [['Séance technique groupe A', '2026-08-12', '17:00', 'sport', 'Cage 1'], ['Sparring contrôlé', '2026-08-14', '18:30', 'sport', 'Cage 2'], ['Bilan de camp — Tiana', '2026-08-19', '10:00', 'meeting', 'Bureau sportif']] },
  fighter: { owner: 'Agenda de Tiana Rakoto', items: [['Entraînement striking', '2026-08-12', '16:30', 'sport', 'Boeny Fight Club'], ['Consultation médicale', '2026-08-14', '11:00', 'medical', 'Clinique des Sports'], ['Pesée officielle MFN', '2026-08-29', '17:00', 'sport', 'Stade Rabemananjara']] },
  organizer: { owner: 'Mialy Events', items: [['Réunion production MFN', '2026-08-13', '09:30', 'meeting', 'Salle Opérations'], ['Test accès & billetterie', '2026-08-20', '14:00', 'deadline', 'Stade Rabemananjara'], ['Mahajanga Fight Night Vol.3', '2026-08-30', '18:00', 'sport', 'Stade Rabemananjara']] },
  referee: { owner: 'Agenda de l’arbitre', items: [['Briefing des officiels', '2026-08-14', '18:30', 'meeting', 'Visioconférence'], ['Open Boeny — affectation', '2026-08-23', '09:00', 'sport', 'Gymnase Couvert'], ['MFN Vol.3 — Main Event', '2026-08-30', '20:30', 'sport', 'Stade Rabemananjara']] },
  judge: { owner: 'Agenda du juge', items: [['Calibration scoring', '2026-08-13', '16:00', 'meeting', 'Centre fédéral'], ['Open Boeny — table 1', '2026-08-23', '09:00', 'sport', 'Gymnase Couvert'], ['MFN Vol.3 — table 2', '2026-08-30', '18:00', 'sport', 'Stade Rabemananjara']] },
  sponsor: { owner: 'Boeny Nutrition', items: [['Validation BAT cage', '2026-08-13', '11:00', 'deadline', 'Studio créatif'], ['Livraison stand VIP', '2026-08-27', '09:00', 'commercial', 'Stade Rabemananjara'], ['Activation MFN Vol.3', '2026-08-30', '16:00', 'commercial', 'Zone VIP']] },
  seller: { owner: 'Boutique officielle', items: [['Réassort Fight Week', '2026-08-13', '08:00', 'deadline', 'Entrepôt'], ['Briefing équipe de vente', '2026-08-28', '15:00', 'meeting', 'Boutique centrale'], ['Stand Marketplace MFN', '2026-08-30', '16:00', 'commercial', 'Stade Rabemananjara']] },
  fan: { owner: 'Mon agenda supporter', items: [['Live — conférence de presse', '2026-08-15', '19:00', 'sport', 'En ligne'], ['Récupération billet MFN', '2026-08-29', '14:00', 'deadline', 'Guichet officiel'], ['Mahajanga Fight Night Vol.3', '2026-08-30', '18:00', 'sport', 'Stade Rabemananjara']] },
};

export function getCalendarMock(role: ErpCalendarRole): { owner: string; events: ErpCalendarEvent[] } {
  const context = roleContexts[role];
  return {
    owner: context.owner,
    events: context.items.map(([title, date, start, type, location], index) => ({
      id: `${role}-${index + 1}`,
      title,
      date,
      start,
      end: `${String(Math.min(Number(start.slice(0, 2)) + 1, 23)).padStart(2, '0')}:${start.slice(3)}`,
      type,
      context: context.owner,
      location,
      status: index === 1 ? 'pending' : index === 2 ? 'urgent' : 'confirmed',
      source: index === 0 ? 'Agenda personnel' : 'Module métier',
    })),
  };
}
