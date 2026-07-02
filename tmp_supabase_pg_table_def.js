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
    const res = await supabase.from('pg_table_def').select('table_name,column_name,data_type').eq('table_name', 'fighters').order('column_name');
    console.log('PG_TABLE_DEF fighters', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('ERROR', err);
  }
})();
