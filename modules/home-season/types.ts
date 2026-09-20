export interface HomeSeasonEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  type: string | null;
  venue: string | null;
  status: string | null;
}

export interface HomeSeasonStatistics {
  events: number;
  upcoming: number;
  completed: number;
  fights: number;
}

export interface HomeSeasonSnapshot {
  season: number;
  nextEvent: HomeSeasonEvent | null;
  statistics: HomeSeasonStatistics;
}
