import type { HomeSeasonRepository } from "../repositories/home-season.repository";

export class HomeSeasonService {
  constructor(private readonly repository: HomeSeasonRepository) {}

  async load(start: string, end: string, now: string) {
    const [events, nextEvent] = await Promise.all([
      this.repository.listPublicEventsBetween(start, end),
      this.repository.findNextPublicEvent(now),
    ]);

    const fights = await this.repository.countFightsForEvents(
      events.map((event) => event.id),
    );

    return { events, nextEvent, fights };
  }
}
