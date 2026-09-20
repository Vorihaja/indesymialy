import { ErpCalendarSupabaseRepository } from "../repositories/erp-calendar-supabase.repository";
import { ErpCalendarService } from "../services/erp-calendar.service";
import { ErpCalendarUseCase } from "../use-cases/erp-calendar.use-case";

export function createErpCalendarUseCase(): ErpCalendarUseCase {
  const repository =
    new ErpCalendarSupabaseRepository();

  const service =
    new ErpCalendarService(repository);

  return new ErpCalendarUseCase(service);
}
