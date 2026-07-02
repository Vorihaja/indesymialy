const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envText = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map(line => {
  const idx = line.indexOf('=');
  return idx === -1 ? [line, ''] : [line.slice(0, idx), line.slice(idx + 1)];
}));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const tables = ['fighters', 'profiles', 'clubs'];
const candidateCols = [
  'id','name','first_name','last_name','full_name','display_name','email','phone','username','handle',
  'discipline','disciplines','sport','category','division','cat','type',
  'region','province','state','location','country',
  'record','fight_record','club','team','rank','ranking','rank_number',
  'weight','age','status','bio','profile','details','created_at','updated_at'
];
(async () => {
  for (const table of tables) {
    console.log('=== TABLE', table, '===');
    for (const col of candidateCols) {
      try {
        const res = await supabase.from(table).select(col).limit(1);
        if (res.error) {
          process.stdout.write(`FAIL ${table}.${col} ${res.error.code}\n`);
        } else {
          process.stdout.write(`OK   ${table}.${col}\n`);
        }
      } catch (err) {
        process.stdout.write(`ERR  ${table}.${col} ${err.toString()}\n`);
      }
    }
  }
})();
