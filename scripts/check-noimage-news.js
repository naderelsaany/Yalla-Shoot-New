// Check no-image news dates + total count
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
fs.readFileSync('.env.local', 'utf-8').split('\n').forEach(l => {
  const [k, v] = l.split('=');
  if (k && v) process.env[k] = v.trim();
});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { count } = await supabase.from('news').select('id', { count: 'exact', head: true });
  console.log('Total news rows:', count);

  const { data: noimg } = await supabase.from('news').select('id, title, published_at').is('image_url', null).order('published_at', { ascending: false });
  console.log('\n=== News with NULL image_url:', noimg ? noimg.length : 0, '===');
  (noimg || []).forEach(n => console.log(n.published_at ? n.published_at.substring(0, 10) : 'NULL', '|', n.title.substring(0, 60)));

  // also empty string
  const { data: emptyimg } = await supabase.from('news').select('id, title, published_at').eq('image_url', '').order('published_at', { ascending: false });
  console.log('\n=== News with empty image_url:', emptyimg ? emptyimg.length : 0, '===');
  (emptyimg || []).forEach(n => console.log(n.published_at ? n.published_at.substring(0, 10) : 'NULL', '|', n.title.substring(0, 60)));
})();
