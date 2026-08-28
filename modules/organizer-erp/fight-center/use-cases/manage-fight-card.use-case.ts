import type { FightCenterService } from '../services/fight-center.service';
import type {
  FightCardDraft,
  FightCardItem,
  FightCardMoveDirection,
} from '../types';

function validateDraft(
  draft: FightCardDraft,
  cards: FightCardItem[],
  editingId?: string,
) {
  if (draft.fighterRedId && draft.fighterBlueId) {
    if (draft.fighterRedId === draft.fighterBlueId) {
      throw new Error(
        'Le même combattant ne peut pas occuper les deux coins du combat.',
      );
    }
  }

  if (draft.status === 'confirmed') {
    if (!draft.disciplineId) {
      throw new Error(
        'Une discipline doit être renseignée avant de confirmer le combat.',
      );
    }

    if (!draft.fighterRedId || !draft.fighterBlueId) {
      throw new Error(
        'Les deux combattants doivent être liés à leur fiche avant confirmation.',
      );
    }
  }

  const fighterIds = [draft.fighterRedId, draft.fighterBlueId].filter(Boolean);

  for (const fighterId of fighterIds) {
    const duplicate = cards.find(
      (card) =>
        card.id !== editingId &&
        card.status !== 'cancelled' &&
        (card.fighterRedId === fighterId || card.fighterBlueId === fighterId),
    );

    if (duplicate) {
      throw new Error(
        'Ce combattant est déjà présent dans un autre combat actif de la Fight Card.',
      );
    }
  }
}

export class ManageFightCardUseCase {
  constructor(
    private readonly service: FightCenterService,
  ) {}

  load(eventId: string) {
    if (!eventId.trim()) {
      throw new Error('Aucun événement actif n’est sélectionné.');
    }

    return this.service.getFightCard(eventId);
  }

  async create(
    eventId: string,
    draft: FightCardDraft,
    cards: FightCardItem[],
  ) {
    validateDraft(draft, cards);
    await this.service.createFightCardEntry(eventId, draft);
  }

  async update(
    cardId: string,
    draft: FightCardDraft,
    cards: FightCardItem[],
  ) {
    validateDraft(draft, cards, cardId);
    await this.service.updateFightCardEntry(cardId, draft);
  }

  remove(eventId: string, cardId: string) {
    return this.service.deleteFightCardEntry(eventId, cardId);
  }

  move(
    eventId: string,
    cardId: string,
    direction: FightCardMoveDirection,
  ) {
    return this.service.moveFightCardEntry(eventId, cardId, direction);
  }

  syncConfirmed(eventId: string, cards: FightCardItem[]) {
    if (!eventId.trim()) {
      throw new Error('Aucun événement actif n’est sélectionné.');
    }

    const confirmed = cards.filter((card) => card.status === 'confirmed');

    if (!confirmed.length) {
      throw new Error(
        'Aucun combat confirmé n’est disponible pour la synchronisation.',
      );
    }

    for (const card of confirmed) {
      if (!card.disciplineId || !card.fighterRedId || !card.fighterBlueId) {
        throw new Error(
          `Le combat #${card.position} est confirmé mais incomplet. Corrigez la Fight Card avant la synchronisation.`,
        );
      }
    }

    return this.service.syncConfirmedFightCard(eventId);
  }
}
