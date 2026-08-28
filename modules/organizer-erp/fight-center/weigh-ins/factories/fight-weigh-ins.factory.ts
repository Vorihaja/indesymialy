import { createSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { FightWeighInSupabaseRepository } from '../repositories/fight-weigh-in-supabase.repository';
import { FightWeighInService } from '../services/fight-weigh-in.service';
import { ManageFightWeighInsUseCase } from '../use-cases/manage-fight-weigh-ins.use-case';

let instance: ManageFightWeighInsUseCase | null = null;

export function createFightWeighInsUseCase() {
  if (!instance) {
    const repository = new FightWeighInSupabaseRepository(
      createSupabaseBrowserClient(),
    );
    const service = new FightWeighInService(repository);
    instance = new ManageFightWeighInsUseCase(service);
  }

  return instance;
}
