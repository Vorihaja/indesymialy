const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envText = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map((line) => {
  const idx = line.indexOf('=');
  return idx === -1 ? [line, ''] : [line.slice(0, idx), line.slice(idx + 1)];
}));

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

(async () => {
  const names = [
    'fighters',
    'contracts',
    'profiles',
    'clubs',
    'events',
    'event',
    'matches',
    'users',
    'tickets',
    'organizers',
    'organisations',
    'competitions',
    'schedules',
    'registrations',
    'members',
    'participants',
    'event_participants',
    'public.events',
    'public.event',
  ];

  console.log('--- TABLE PROBE ---');
  for (const name of names) {
    try {
      const res = await supabase.from(name).select('*').limit(1);
      console.log('TABLE', name, JSON.stringify({ status: res.status, error: res.error ? res.error.message : null, dataLength: res.data?.length ?? null }, null, 2));
    } catch (err) {
      console.log('TABLE_ERR', name, err.toString());
    }
  }

  const schemaCandidates = ['public', 'app', 'erp', 'api', 'supabase', 'event', 'dashboard', 'main', 'system'];
  console.log('\n--- SCHEMA PROBE FOR events ---');
  for (const schema of schemaCandidates) {
    try {
      const res = await supabase.from('events').schema(schema).select('*').limit(1);
      console.log('SCHEMA', schema, JSON.stringify({ status: res.status, error: res.error ? res.error.message : null, dataLength: res.data?.length ?? null }, null, 2));
    } catch (err) {
      console.log('SCHEMA_ERR', schema, err.toString());
    }
  }
})();
