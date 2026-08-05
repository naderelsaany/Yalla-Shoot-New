/**
 * News Cleanup Policy: delete news older than 15 days + their storage images
 */
const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const i = l.indexOf('='); if (i > 0) process.env[l.slice(0, i)] = l.slice(i + 1); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const cutoff = new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString();

(async () => {
  // Fetch all old news (paginate)
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await sup.from('news')
      .select('id, title, image_url, published_at')
      .lt('published_at', cutoff)
      .range(from, from + 999);
    if (error) { console.log('❌ fetch error:', error.message); break; }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    from += 1000;
    if (data.length < 1000) break;
  }
  console.log(`Found ${all.length} news older than 15 days`);

  // Collect storage filenames (only from news-images bucket)
  const files = [];
  for (const n of all) {
    if (n.image_url && n.image_url.includes('/storage/v1/object/public/news-images/')) {
      const fname = decodeURIComponent(n.image_url.split('/news-images/')[1]);
      if (fname) files.push(fname);
    }
  }
  console.log(`Storage images to delete: ${files.length}`);

  // Delete storage images in batches of 100
  for (let i = 0; i < files.length; i += 100) {
    const batch = files.slice(i, i + 100);
    const { error } = await sup.storage.from('news-images').remove(batch);
    if (error) console.log(`⚠️ storage batch ${i}: ${error.message}`);
  }
  console.log('✅ storage cleanup done');

  // Delete news rows in batches
  const ids = all.map(n => n.id);
  for (let i = 0; i < ids.length; i += 500) {
    const batch = ids.slice(i, i + 500);
    const { error } = await sup.from('news').delete().in('id', batch);
    if (error) console.log(`❌ news batch ${i}: ${error.message}`);
  }
  console.log(`✅ deleted ${ids.length} news rows`);
})();
