import type {
  FightWeighInAttemptDraft,
  FightWeighInSnapshot,
  FightWeighInWaiverDraft,
} from '../types';

export interface FightWeighInRepository {
  load(eventId: string): Promise<FightWeighInSnapshot>;

  createAttempt(
    eventId: string,
    draft: FightWeighInAttemptDraft,
  ): Promise<void>;

  waive(
    eventId: string,
    draft: FightWeighInWaiverDraft,
  ): Promise<void>;
}
