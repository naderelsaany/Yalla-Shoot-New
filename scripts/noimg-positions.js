// Where do no-image news fall in the listing order?
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
fs.readFileSync('.env.local', 'utf-8').split('\n').forEach(l => {
  const i = l.indexOf('='); if (i > 0) process.env[l.slice(0, i)] = l.slice(i + 1);
});
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data: all, error } = await sup.from('news')
    .select('id, title, image_url, published_at')
    .order('published_at', { ascending: false })
    .limit(500);
  if (error) { console.log('err', error.message); return; }
  const noimgPos = [];
  all.forEach((n, i) => {
    if (!n.image_url) noimgPos.push({ pos: i + 1, page: Math.floor(i / 12) + 1, date: (n.published_at || '').substring(0, 10), title: n.title.substring(0, 45) });
  });
  console.log('No-image news positions (of', all.length, 'newest):');
  noimgPos.forEach(x => console.log(`pos=${x.pos} page=${x.page} ${x.date} | ${x.title}`));
})();
