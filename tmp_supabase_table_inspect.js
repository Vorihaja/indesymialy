const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envText = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map(line => {
  const idx = line.indexOf('=');
  return idx === -1 ? [line, ''] : [line.slice(0, idx), line.slice(idx + 1)];
}));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
  const tables = ['profiles', 'clubs', 'fighters'];
  for (const table of tables) {
    try {
      const res = await supabase.from(table).select('*').limit(2);
      console.log('TABLE', table, JSON.stringify({ success: res.success, status: res.status, error: res.error, data: res.data }, null, 2));
    } catch (err) {
      console.error('TABLE_ERR', table, err.toString());
    }
  }
})();
