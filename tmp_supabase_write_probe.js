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
    { table: 'profiles', row: { username: 'test_write_probe', phone: '000' } },
    { table: 'clubs', row: { id: '00000000-0000-0000-0000-000000000000' } },
  ];
  for (const { table, row } of candidates) {
    try {
      const res = await supabase.from(table).insert([row]).select('*');
      console.log('INSERT', table, JSON.stringify(res, null, 2));
      if (res.data && res.data.length) {
        const cleanup = await supabase.from(table).delete().eq('id', row.id || res.data[0].id);
        console.log('DELETE', table, JSON.stringify(cleanup, null, 2));
      }
    } catch (err) {
      console.error('ERROR', table, err.toString());
    }
  }
})();
