const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envText = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map(line => {
  const idx = line.indexOf('=');
  return idx === -1 ? [line, ''] : [line.slice(0, idx), line.slice(idx + 1)];
}));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

(async () => {
  const candidates = [
    'events',
    'event',
    'evenements',
    'evenement',
    'fight_cards',
    'fightcard',
    'fight_card',
    'event_cards',
    'event_card',
    'matches',
    'match',
    'competitions',
    'competition',
    'tournaments',
    'tournament',
    'schedules',
    'schedule',
    'live_events',
    'events_live',
    'platform_events',
    'organizer_events',
    'organisateur_events',
    'public.events',
    'public.event',
    'erp.events',
    'app.events',
    'dashboard.events',
    'organisateur.events',
    'main.events',
    'settings.events',
  ];

  for (const table of candidates) {
    try {
      const res = await supabase.from(table).select('*').limit(1);
      console.log('CANDIDATE', table, JSON.stringify({ status: res.status, error: res.error ? res.error.message : null, data: res.data }, null, 2));
    } catch (err) {
      console.log('CANDIDATE_ERR', table, err.toString());
    }
  }
})();
