export type ErpCalendarRole =
  | 'super-admin' | 'admin' | 'federation' | 'league' | 'club' | 'coach'
  | 'fighter' | 'organizer' | 'referee' | 'judge' | 'sponsor' | 'seller' | 'fan';

export type ErpCalendarEventType = 'sport' | 'meeting' | 'deadline' | 'travel' | 'medical' | 'commercial';

export type ErpCalendarEvent = {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  type: ErpCalendarEventType;
  context: string;
  location: string;
  status: 'confirmed' | 'pending' | 'urgent';
  source: string;
};
