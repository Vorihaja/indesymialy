import type { FightWeighInRepository } from '../repositories/fight-weigh-in.repository';
import type {
  FightWeighInAttemptDraft,
  FightWeighInWaiverDraft,
} from '../types';

export class FightWeighInService {
  constructor(
    private readonly repository: FightWeighInRepository,
  ) {}

  load(eventId: string) {
    return this.repository.load(eventId);
  }

  createAttempt(
    eventId: string,
    draft: FightWeighInAttemptDraft,
  ) {
    return this.repository.createAttempt(eventId, draft);
  }

  waive(
    eventId: string,
    draft: FightWeighInWaiverDraft,
  ) {
    return this.repository.waive(eventId, draft);
  }
}
