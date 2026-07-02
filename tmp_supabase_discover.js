const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envText = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map(line => {
  const idx = line.indexOf('=');
  return idx === -1 ? [line, ''] : [line.slice(0, idx), line.slice(idx + 1)];
}));

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

(async () => {
  const targets = [
    'information_schema.tables',
    'pg_catalog.pg_tables',
    'pg_table_def',
    'events',
    'events_view',
    'event',
    'events_public',
    'organizer_events',
    'platform_events'
  ];

  for (const target of targets) {
    try {
      const res = await supabase.from(target).select('table_schema,table_name').limit(20);
      console.log('TARGET', target, JSON.stringify({ status: res.status, error: res.error ? res.error.message : null, data: res.data }, null, 2));
    } catch (err) {
      console.log('TARGET_ERR', target, err.toString());
    }
  }
})();
