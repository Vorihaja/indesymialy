const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envText = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map(line => {
  const idx = line.indexOf('=');
  return idx === -1 ? [line, ''] : [line.slice(0, idx), line.slice(idx + 1)];
}));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const tables = ['profiles', 'clubs'];
const candidateCols = [
  'id','created_at','updated_at','full_name','username','email','phone','first_name','last_name','display_name','role','status','country','province','region','club','team','category','discipline','bio','website','avatar_url','address'
];
(async () => {
  for (const table of tables) {
    console.log(`=== TABLE ${table} ===`);
    for (const col of candidateCols) {
      try {
        const res = await supabase.from(table).select(col).limit(1);
        if (res.error) {
          console.log(`FAIL ${table}.${col} ${res.error.code}`);
        } else {
          console.log(`OK   ${table}.${col}`);
        }
      } catch (err) {
        console.log(`ERR  ${table}.${col} ${err}`);
      }
    }
    console.log('');
  }
})();
