import type { FightOfficialsService } from '../services/fight-officials.service';
import type {
  AssignFightOfficialDraft,
  UpdateFightOfficialStatusDraft,
} from '../types';

export class ManageFightOfficialsUseCase {
  constructor(
    private readonly service: FightOfficialsService,
  ) {}

  load(eventId: string) {
    return this.service.load(eventId);
  }

  assign(eventId: string, draft: AssignFightOfficialDraft) {
    return this.service.assign(eventId, draft);
  }

  updateStatus(
    eventId: string,
    draft: UpdateFightOfficialStatusDraft,
  ) {
    return this.service.updateStatus(eventId, draft);
  }
}
