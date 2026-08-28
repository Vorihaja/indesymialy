import type {
  AssignFightOfficialDraft,
  FightOfficialsSnapshot,
  UpdateFightOfficialStatusDraft,
} from '../types';

export interface FightOfficialsRepository {
  load(eventId: string): Promise<FightOfficialsSnapshot>;
  assign(eventId: string, draft: AssignFightOfficialDraft): Promise<void>;
  updateStatus(
    eventId: string,
    draft: UpdateFightOfficialStatusDraft,
  ): Promise<void>;
}
