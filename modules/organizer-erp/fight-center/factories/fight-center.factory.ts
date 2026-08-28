import { createSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { FightCenterSupabaseRepository } from '../repositories/fight-center-supabase.repository';
import { FightCenterService } from '../services/fight-center.service';
import { ManageFightCardUseCase } from '../use-cases/manage-fight-card.use-case';

let instance: ManageFightCardUseCase | null = null;

export function createFightCenterUseCase() {
  if (!instance) {
    const repository = new FightCenterSupabaseRepository(
      createSupabaseBrowserClient(),
    );

    const service = new FightCenterService(repository);
    instance = new ManageFightCardUseCase(service);
  }

  return instance;
}
