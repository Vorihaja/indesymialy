import type { FightCenterRepository } from '../repositories/fight-center.repository';
import type {
  FightCardDraft,
  FightCardMoveDirection,
  OperationalFightDraft,
} from '../types';

export class FightCenterService {
  constructor(
    private readonly repository: FightCenterRepository,
  ) {}

  getFightCard(eventId: string) {
    return this.repository.loadFightCard(eventId);
  }

  createFightCardEntry(eventId: string, draft: FightCardDraft) {
    return this.repository.createFightCardEntry(eventId, draft);
  }

  updateFightCardEntry(cardId: string, draft: FightCardDraft) {
    return this.repository.updateFightCardEntry(cardId, draft);
  }

  deleteFightCardEntry(eventId: string, cardId: string) {
    return this.repository.deleteFightCardEntry(eventId, cardId);
  }

  moveFightCardEntry(
    eventId: string,
    cardId: string,
    direction: FightCardMoveDirection,
  ) {
    return this.repository.moveFightCardEntry(eventId, cardId, direction);
  }

  syncConfirmedFightCard(eventId: string) {
    return this.repository.syncConfirmedFightCard(eventId);
  }

  getOperationalFights(eventId: string) {
    return this.repository.loadOperationalFights(eventId);
  }

  updateOperationalFight(
    eventId: string,
    fightId: string,
    draft: OperationalFightDraft,
  ) {
    return this.repository.updateOperationalFight(eventId, fightId, draft);
  }

  markOperationalFightReady(eventId: string, fightId: string) {
    return this.repository.markOperationalFightReady(eventId, fightId);
  }

  returnOperationalFightToScheduled(eventId: string, fightId: string) {
    return this.repository.returnOperationalFightToScheduled(eventId, fightId);
  }
}
