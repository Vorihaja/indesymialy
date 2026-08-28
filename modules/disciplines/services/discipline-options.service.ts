import type { DisciplineOptionsRepository } from "../repositories/discipline-options.repository";
export class DisciplineOptionsService {
  constructor(private readonly repository: DisciplineOptionsRepository) {}
  list() { return this.repository.list(); }
}