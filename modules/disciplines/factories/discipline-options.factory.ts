import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { DisciplineOptionsRepository } from "../repositories/discipline-options.repository";
import { DisciplineOptionsService } from "../services/discipline-options.service";
import { ListDisciplineOptionsUseCase } from "../use-cases/list-discipline-options.use-case";
let instance: ListDisciplineOptionsUseCase | undefined;
export function createListDisciplineOptionsUseCase() {
  instance ??= new ListDisciplineOptionsUseCase(new DisciplineOptionsService(new DisciplineOptionsRepository(createSupabaseBrowserClient())));
  return instance;
}