import type {
  FightCardDraft,
  FightCardMoveDirection,
  FightCardSnapshot,
  FightCardSyncResult,
  OperationalFightDraft,
  OperationalFightSnapshot,
} from '../types';

export interface FightCenterRepository {
  loadFightCard(eventId: string): Promise<FightCardSnapshot>;

  createFightCardEntry(
    eventId: string,
    draft: FightCardDraft,
  ): Promise<void>;

  updateFightCardEntry(
    cardId: string,
    draft: FightCardDraft,
  ): Promise<void>;

  deleteFightCardEntry(
    eventId: string,
    cardId: string,
  ): Promise<void>;

  moveFightCardEntry(
    eventId: string,
    cardId: string,
    direction: FightCardMoveDirection,
  ): Promise<void>;

  syncConfirmedFightCard(eventId: string): Promise<FightCardSyncResult>;

  loadOperationalFights(eventId: string): Promise<OperationalFightSnapshot>;

  updateOperationalFight(
    eventId: string,
    fightId: string,
    draft: OperationalFightDraft,
  ): Promise<void>;

  markOperationalFightReady(
    eventId: string,
    fightId: string,
  ): Promise<void>;

  returnOperationalFightToScheduled(
    eventId: string,
    fightId: string,
  ): Promise<void>;
}
