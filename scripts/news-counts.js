// Exact counts for cleanup decisions
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
fs.readFileSync('.env.local', 'utf-8').split('\n').forEach(l => {
  const [k, v] = l.split('=');
  if (k && v) process.env[k] = v.trim();
});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { count: total } = await supabase.from('news').select('id', { count: 'exact', head: true });
  console.log('TOTAL news:', total);

  const cutoff = new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString();
  console.log('Cutoff (15d ago):', cutoff);

  const { count: old } = await supabase.from('news').select('id', { count: 'exact', head: true }).lt('published_at', cutoff);
  console.log('News OLDER than 15 days:', old);

  const { count: noimg } = await supabase.from('news').select('id', { count: 'exact', head: true }).is('image_url', null);
  console.log('News with NULL image_url:', noimg);

  // no-image news older than 15d vs within
  const { count: noimgOld } = await supabase.from('news').select('id', { count: 'exact', head: true }).is('image_url', null).lt('published_at', cutoff);
  console.log('  of which older than 15d:', noimgOld);

  // broken file check: does news-a0828370 exist in bucket listing
  const { data: files, error } = await supabase.storage.from('news-images').list('', { limit: 100, offset: 0 });
  if (error) console.log('bucket list error:', error.message);
  else console.log('bucket sample count:', files.length);

  // list a few old news ids to delete (sample)
  const { data: olds } = await supabase.from('news').select('id, title, published_at').lt('published_at', cutoff).order('published_at', { ascending: false }).limit(5);
  (olds || []).forEach(n => console.log('OLD SAMPLE:', n.published_at.substring(0, 10), '|', n.title.substring(0, 55)));
})();
