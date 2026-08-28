import type { FightWeighInService } from '../services/fight-weigh-in.service';
import type {
  FightWeighInAttemptDraft,
  FightWeighInWaiverDraft,
} from '../types';

export class ManageFightWeighInsUseCase {
  constructor(
    private readonly service: FightWeighInService,
  ) {}

  load(eventId: string) {
    if (!eventId.trim()) {
      throw new Error('Aucun événement actif n’est sélectionné.');
    }

    return this.service.load(eventId);
  }

  createAttempt(
    eventId: string,
    draft: FightWeighInAttemptDraft,
  ) {
    if (!draft.fighterId.trim()) {
      throw new Error('Le combattant doit être lié avant la pesée.');
    }

    if (!Number.isFinite(draft.measuredWeightKg) || draft.measuredWeightKg <= 0) {
      throw new Error('Le poids mesuré doit être supérieur à 0 kg.');
    }

    if (
      draft.minimumWeightKg !== null &&
      draft.maximumWeightKg !== null &&
      draft.minimumWeightKg >= draft.maximumWeightKg
    ) {
      throw new Error('La limite minimale doit être inférieure à la limite maximale.');
    }

    return this.service.createAttempt(eventId, draft);
  }

  waive(
    eventId: string,
    draft: FightWeighInWaiverDraft,
  ) {
    if (!draft.reason.trim()) {
      throw new Error('Le motif de la dérogation est obligatoire.');
    }

    return this.service.waive(eventId, draft);
  }
}
