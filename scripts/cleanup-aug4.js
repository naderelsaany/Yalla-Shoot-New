const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local','utf-8').split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)$/); if(m) process.env[m[1].trim()] = m[2].trim(); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = 'news-images';

const filenameFromUrl = (url) => {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length).split(/[?#]/)[0];
};

(async () => {
  const cutoff = new Date(Date.now() - 15 * 86400000).toISOString();

  // 1) News older than 15 days
  const { data: oldNews } = await sup.from('news').select('id, image_url').lt('published_at', cutoff);
  console.log(`[1] Old news (>15 days) to delete: ${oldNews ? oldNews.length : 0}`);

  // 2) Explicit non-sports titles (any age)
  const nonSportsTitlePatterns = [
    'الاتحاد الأوروبي يغرم',
    'علي إكسبرس',
    'عقوبات جديدة ضد روسيا',
    'الدينار الكويتي',
  ];
  const { data: allNews } = await sup.from('news').select('id, image_url, title');
  const nonSports = (allNews || []).filter(n =>
    nonSportsTitlePatterns.some(p => n.title.includes(p))
  );
  console.log(`[2] Non-sports news to delete: ${nonSports.length}`);
  nonSports.forEach(n => console.log('   -', n.title.slice(0, 70)));

  // Combine
  const toDelete = [];
  const seen = new Set();
  for (const n of (oldNews || [])) { if (!seen.has(n.id)) { seen.add(n.id); toDelete.push(n); } }
  for (const n of nonSports) { if (!seen.has(n.id)) { seen.add(n.id); toDelete.push(n); } }

  // Delete images from storage first
  const filenames = toDelete.map(n => filenameFromUrl(n.image_url)).filter(Boolean);
  const uniqueFilenames = [...new Set(filenames)];
  console.log(`[3] Storage images to delete: ${uniqueFilenames.length}`);
  if (uniqueFilenames.length) {
    // Delete in batches of 100
    for (let i = 0; i < uniqueFilenames.length; i += 100) {
      const batch = uniqueFilenames.slice(i, i + 100);
      const { error: delErr } = await sup.storage.from(BUCKET).remove(batch);
      console.log(`   batch ${i}-${i + batch.length}: ${delErr ? 'ERR ' + delErr.message : 'ok'}`);
    }
  }

  // Delete news rows in batches
  const ids = toDelete.map(n => n.id);
  let totalGone = 0;
  const batchSize = 100;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const { data, error } = await sup.from('news').delete().in('id', batch).select('id');
    if (error) { console.log('   row delete ERR', error.message); }
    else totalGone += (data ? data.length : 0);
  }
  console.log(`[4] News rows deleted: ${totalGone}`);

  const { count } = await sup.from('news').select('id', { count: 'exact', head: true });
  console.log(`[5] Remaining news count: ${count}`);
})();