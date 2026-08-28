import type { DisciplineOptionsService } from "../services/discipline-options.service";
export class ListDisciplineOptionsUseCase {
  constructor(private readonly service: DisciplineOptionsService) {}
  execute() { return this.service.list(); }
}