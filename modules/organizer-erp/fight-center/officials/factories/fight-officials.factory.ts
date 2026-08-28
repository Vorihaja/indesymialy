import { createSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { FightOfficialsSupabaseRepository } from '../repositories/fight-officials-supabase.repository';
import { FightOfficialsService } from '../services/fight-officials.service';
import { ManageFightOfficialsUseCase } from '../use-cases/manage-fight-officials.use-case';

let instance: ManageFightOfficialsUseCase | null = null;

export function createFightOfficialsUseCase() {
  if (!instance) {
    const repository = new FightOfficialsSupabaseRepository(
      createSupabaseBrowserClient(),
    );
    const service = new FightOfficialsService(repository);
    instance = new ManageFightOfficialsUseCase(service);
  }

  return instance;
}
