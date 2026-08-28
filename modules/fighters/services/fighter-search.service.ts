import {
  FighterSearchRepository,
  type FighterSearchFilters,
} from "@/modules/fighters/repositories/fighter-search.repository";

import type { Fighter } from "@/modules/fighters/types";

export class FighterSearchService {
  constructor(
    private readonly repository =
      new FighterSearchRepository()
  ) {}

  async search(
    filters: FighterSearchFilters
  ): Promise<Fighter[]> {
    return this.repository.search(filters);
  }
}