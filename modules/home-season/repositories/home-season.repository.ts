import type { HomeSeasonEvent } from "../types";

export interface HomeSeasonRepository {
  listPublicEventsBetween(start: string, end: string): Promise<HomeSeasonEvent[]>;
  findNextPublicEvent(after: string): Promise<HomeSeasonEvent | null>;
  countFightsForEvents(eventIds: string[]): Promise<number>;
}
