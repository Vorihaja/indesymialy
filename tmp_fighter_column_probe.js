const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envText = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map(line => {
  const idx = line.indexOf('=');
  return idx === -1 ? [line, ''] : [line.slice(0, idx), line.slice(idx + 1)];
}));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
  const candidateCols = [
    'name','first_name','last_name','full_name','display_name','title','username','handle',
    'discipline','disciplines','sport','category','division','cat',
    'region','province','state','location','country',
    'record','fight_record','club','team','rank','ranking','rank_number',
    'weight','age','status','bio','profile','details'
  ];
  for (const col of candidateCols) {
    const value = typeof col === 'string' ? `probe_${col}` : 'probe';
    const row = { id: '00000000-0000-0000-0000-000000000000', [col]: value };
    try {
      const res = await supabase.from('fighters').insert([row]).select('*');
      if (res.error) {
        console.log('FAILED', col, res.error.code, res.error.message);
      } else {
        console.log('OK', col, JSON.stringify(res.data, null, 2));
        await supabase.from('fighters').delete().eq('id', row.id);
        break;
      }
    } catch (err) {
      console.error('ERROR', col, err.toString());
    }
  }
})();
