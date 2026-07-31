// Cleanup script: delete old news (>15d) + duplicate news
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

fs.readFileSync('.env.local', 'utf-8').split('\n').forEach(l => {
  const i = l.indexOf('=');
  if (i > 0) { const k = l.slice(0, i).trim(); const v = l.slice(i + 1).trim(); if (k) process.env[k] = v; }
});
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function deleteNewsWithImage(row) {
  // Extract filename from Supabase Storage URL
  const m = (row.image_url || '').match(/\/storage\/v1\/object\/public\/news-images\/([^?]+)/);
  if (m) {
    try {
      const { error } = await sup.storage.from('news-images').remove([decodeURIComponent(m[1])]);
      if (error) console.log('  ⚠️ storage remove fail:', error.message, '|', m[1]);
      else console.log('  🗑️ image removed:', m[1]);
    } catch (e) { console.log('  ⚠️ storage error:', e.message); }
  }
  const { error } = await sup.from('news').delete().eq('id', row.id);
  if (error) console.log('  ❌ delete row fail:', error.message, '|', row.id);
  else console.log('  ✅ news deleted:', (row.title || '').substring(0, 50), '|', row.id);
}

(async () => {
  // 1. Old news > 15 days
  const cutoff = new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString();
  const { data: oldNews, error: e1 } = await sup.from('news')
    .select('id, title, image_url, published_at')
    .lt('published_at', cutoff);
  if (e1) { console.error('ERR old news query:', e1.message); return; }
  console.log(`📰 OLD NEWS (>15d, cutoff ${cutoff}): ${oldNews.length}`);
  for (const n of oldNews) await deleteNewsWithImage(n);

  // 2. Duplicates (keep the most recently published, delete older ones)
  const { data: allNews, error: e2 } = await sup.from('news')
    .select('id, title, image_url, published_at')
    .order('published_at', { ascending: false })
    .limit(2000);
  if (e2) { console.error('ERR dup query:', e2.message); return; }
  const seen = new Map(); // title -> newest id kept
  const toDelete = [];
  for (const n of allNews) {
    const t = (n.title || '').trim();
    if (seen.has(t)) toDelete.push(n);
    else seen.set(t, n.id);
  }
  console.log(`\n🔁 DUPLICATES: ${toDelete.length}`);
  for (const n of toDelete) await deleteNewsWithImage(n);

  // 3. Verify counts
  const { count: c } = await sup.from('news').select('id', { count: 'exact', head: true });
  console.log('\n📊 Final news count:', c);
})().catch(e => console.error('FATAL', e.message));
