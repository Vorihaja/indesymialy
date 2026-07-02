const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envText = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map(line => {
  const idx = line.indexOf('=');
  return idx === -1 ? [line, ''] : [line.slice(0, idx), line.slice(idx + 1)];
}));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
  const sample = {
    name: 'TEST_FIGHTER_SUPABASE',
    discipline: 'MMA',
    region: 'Test Region',
    province: 'Test Province',
    record: '0-0-0',
    club: 'Test Club',
    rank: 999,
  };
  try {
    const res = await supabase.from('fighters').insert([sample]).select('*');
    console.log('INSERT', JSON.stringify(res, null, 2));
    if (res.data && res.data.length) {
      const cleanup = await supabase.from('fighters').delete().eq('name', sample.name);
      console.log('DELETE', JSON.stringify(cleanup, null, 2));
    }
  } catch (err) {
    console.error('ERROR', err);
  }
})();
