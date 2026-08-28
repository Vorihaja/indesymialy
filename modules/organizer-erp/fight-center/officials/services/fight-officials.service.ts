import type { FightOfficialsRepository } from '../repositories/fight-officials.repository';
import type {
  AssignFightOfficialDraft,
  UpdateFightOfficialStatusDraft,
} from '../types';

export class FightOfficialsService {
  constructor(
    private readonly repository: FightOfficialsRepository,
  ) {}

  load(eventId: string) {
    return this.repository.load(eventId);
  }

  assign(eventId: string, draft: AssignFightOfficialDraft) {
    return this.repository.assign(eventId, draft);
  }

  updateStatus(
    eventId: string,
    draft: UpdateFightOfficialStatusDraft,
  ) {
    return this.repository.updateStatus(eventId, draft);
  }
}
