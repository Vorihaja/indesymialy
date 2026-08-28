import { FighterRepository } from "../repositories/fighter.repository";
import { FighterSearchRepository } from "../repositories/fighter-search.repository";
import { FighterService } from "../services/fighters.service";
import { FighterSearchService } from "../services/fighter-search.service";
import { GetFighterDashboardUseCase } from "../use-cases/get-fighter-dashboard.use-case";
import { SearchFightersUseCase } from "../use-cases/search-fighters.use-case";


export function makeFighterService() {

  return new FighterService(
    new FighterRepository()
  );

}

export function makeFighterDashboardUseCase() {
  return new GetFighterDashboardUseCase(makeFighterService());
}

export function makeSearchFightersUseCase() {
  return new SearchFightersUseCase(
    new FighterSearchService(new FighterSearchRepository())
  );
}
