import type { FightCenterService } from '../services/fight-center.service';
import type {
  OperationalFightDraft,
  OperationalFightItem,
} from '../types';

function validateDraft(
  draft: OperationalFightDraft,
) {
  if (
    !Number.isInteger(
      draft.scheduledRounds,
    ) ||
    draft.scheduledRounds < 1 ||
    draft.scheduledRounds > 12
  ) {
    throw new Error(
      'Le nombre de rounds doit être compris entre 1 et 12.',
    );
  }

  if (!draft.fightType.trim()) {
    throw new Error(
      'Le type de combat est obligatoire.',
    );
  }
}

export class ManageOperationalFightsUseCase {
  constructor(
    private readonly service: FightCenterService,
  ) {}

  load(eventId: string) {
    if (!eventId.trim()) {
      throw new Error(
        'Aucun événement actif n’est sélectionné.',
      );
    }

    return this.service.getOperationalFights(
      eventId,
    );
  }

  async update(
    eventId: string,
    fightId: string,
    draft: OperationalFightDraft,
  ) {
    validateDraft(draft);

    return this.service.updateOperationalFight(
      eventId,
      fightId,
      draft,
    );
  }

  markReady(
    eventId: string,
    fight: OperationalFightItem,
  ) {
    if (fight.blockers.length) {
      throw new Error(
        `Combat #${fight.fightOrder} incomplet : ${fight.blockers.join(', ')}.`,
      );
    }

    if (!fight.canMarkReady) {
      throw new Error(
        'Ce combat ne peut pas être marqué prêt dans son état actuel.',
      );
    }

    return this.service.markOperationalFightReady(
      eventId,
      fight.id,
    );
  }

  returnToScheduled(
    eventId: string,
    fight: OperationalFightItem,
  ) {
    if (!fight.canReturnToScheduled) {
      throw new Error(
        'Ce combat ne peut pas être repassé en préparation.',
      );
    }

    return this.service.returnOperationalFightToScheduled(
      eventId,
      fight.id,
    );
  }
}
