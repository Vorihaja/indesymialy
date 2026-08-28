import type { Fighter } from "@/modules/fighters/types";

import {
  FighterSearchService,
} from "@/modules/fighters/services/fighter-search.service";

import type {
  FighterSearchFilters,
} from "@/modules/fighters/repositories/fighter-search.repository";


export class SearchFightersUseCase {

  constructor(
    private readonly service: FighterSearchService
  ) {}

  async execute(
    filters: FighterSearchFilters
  ): Promise<Fighter[]> {

    return this.service.search(filters);

  }
}