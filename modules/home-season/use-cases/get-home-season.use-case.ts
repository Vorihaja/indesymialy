import type { HomeSeasonService } from "../services/home-season.service";
import type { HomeSeasonSnapshot } from "../types";

const MADAGASCAR_TIME_ZONE = "Indian/Antananarivo";

function yearInMadagascar(date: Date) {
  const yearPart = new Intl.DateTimeFormat("en", {
    timeZone: MADAGASCAR_TIME_ZONE,
    year: "numeric",
  })
    .formatToParts(date)
    .find((part) => part.type === "year");

  return Number(yearPart?.value ?? date.getUTCFullYear());
}

export class GetHomeSeasonUseCase {
  constructor(private readonly service: HomeSeasonService) {}

  async execute(now = new Date()): Promise<HomeSeasonSnapshot> {
    const season = yearInMadagascar(now);
    const seasonStart = `${season}-01-01T00:00:00+03:00`;
    const nextSeasonStart = `${season + 1}-01-01T00:00:00+03:00`;
    const nowIso = now.toISOString();
    const { events, nextEvent, fights } = await this.service.load(
      seasonStart,
      nextSeasonStart,
      nowIso,
    );

    const upcoming = events.filter((event) => event.startsAt >= nowIso).length;
    const completed = events.filter((event) => {
      if (event.status === "completed") {
        return true;
      }

      const ending = event.endsAt ?? event.startsAt;
      return ending < nowIso;
    }).length;

    return {
      season,
      nextEvent,
      statistics: {
        events: events.length,
        upcoming,
        completed,
        fights,
      },
    };
  }
}
