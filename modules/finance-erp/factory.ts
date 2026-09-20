import { createSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { FinanceRepository } from './repository';
import { FinanceService } from './service';
import { FinanceUseCase } from './use-case';
import { resolveFinanceExpectedScope } from './owner-context';

export function createFinanceUseCase(role: string) {
  const client =
    createSupabaseBrowserClient();
  const repository =
    new FinanceRepository(
      client,
      resolveFinanceExpectedScope(role),
    );
  const service =
    new FinanceService(repository);

  return new FinanceUseCase(service);
}
