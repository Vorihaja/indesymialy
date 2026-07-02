const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envText = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map(line => {
  const idx = line.indexOf('=');
  return idx === -1 ? [line, ''] : [line.slice(0, idx), line.slice(idx + 1)];
}));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
  try {
    const row = { id: '00000000-0000-0000-0000-000000000001' };
    const insertRes = await supabase.from('fighters').insert([row]).select('*');
    console.log('INSERT', JSON.stringify(insertRes, null, 2));
    if (insertRes.data && insertRes.data.length) {
      const deleteRes = await supabase.from('fighters').delete().eq('id', row.id);
      console.log('DELETE', JSON.stringify(deleteRes, null, 2));
    }
  } catch (err) {
    console.error('ERROR', err);
  }
})();
