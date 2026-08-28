import { createSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { FightCenterSupabaseRepository } from '../repositories/fight-center-supabase.repository';
import { FightCenterService } from '../services/fight-center.service';
import { ManageOperationalFightsUseCase } from '../use-cases/manage-operational-fights.use-case';

let instance: ManageOperationalFightsUseCase | null = null;

export function createOperationalFightsUseCase() {
  if (!instance) {
    const repository = new FightCenterSupabaseRepository(
      createSupabaseBrowserClient(),
    );

    const service = new FightCenterService(repository);
    instance = new ManageOperationalFightsUseCase(service);
  }

  return instance;
}
