/**
 * Self-monitoring maintenance (2026-08-03):
 * 1. Delete FINISHED matches older than 48h
 * 2. Delete stale SCHEDULED matches with match_date in the past
 * 3. Delete news older than 15 days + remove images from storage
 * 4. Scan all team logo_urls (HTTP check) -> report broken
 * 5. Scan recent news image_urls -> report broken
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const PROJECT_DIR = process.cwd();
const env = fs.readFileSync(path.join(PROJECT_DIR, '.env.local'), 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET = 'news-images';
const NOW = Date.now();
const H48 = 48 * 3600 * 1000;
const D15 = 15 * 24 * 3600 * 1000;

function checkUrl(url, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    fetch(url, { method: 'HEAD', signal: ctrl.signal, redirect: 'follow' })
      .then((r) => {
        clearTimeout(t);
        const ct = r.headers.get('content-type') || '';
        resolve({ ok: r.ok, ct: ct.split(';')[0], status: r.status });
      })
      .catch(() => { clearTimeout(t); resolve({ ok: false, ct: '', status: 0 }); });
  });
}

async function main() {
  // ============ 1. Matches cleanup ============
  const { data: matches } = await supabase.from('matches').select('id, match_date, status, slug');
  const cutoff48 = new Date(NOW - H48).toISOString();
  const nowIso = new Date(NOW).toISOString();

  const toDeleteFinished = (matches || []).filter(
    (m) => m.status === 'FINISHED' && m.match_date < cutoff48
  );
  const toDeleteStale = (matches || []).filter(
    (m) => m.status !== 'FINISHED' && m.match_date < nowIso
  );

  console.log(`🧹 Finished >48h: ${toDeleteFinished.length} | Stale SCHEDULED (past date): ${toDeleteStale.length}`);

  for (const m of [...toDeleteFinished, ...toDeleteStale]) {
    const { error } = await supabase.from('matches').delete().eq('id', m.id);
    if (error) console.log('  ❌ del match fail:', m.slug, error.message);
  }
  console.log('✅ matches cleaned');

  // ============ 2. News cleanup (older than 15 days) ============
  const cutoff15 = new Date(NOW - D15).toISOString();
  const { data: oldNews } = await supabase
    .from('news')
    .select('id, slug, image_url')
    .lt('published_at', cutoff15)
    .limit(500);
  console.log(`🗞️  News older than 15d: ${oldNews ? oldNews.length : 0}`);

  let imgRemoved = 0, newsDeleted = 0;
  if (oldNews && oldNews.length) {
    for (const n of oldNews) {
      // delete storage image if it's a Supabase Storage URL
      if (n.image_url && n.image_url.includes('/storage/v1/object/public/' + BUCKET + '/')) {
        const filename = decodeURIComponent(n.image_url.split(BUCKET + '/')[1] || '');
        if (filename) {
          const { error: se } = await supabase.storage.from(BUCKET).remove([filename]);
          if (!se) imgRemoved++;
        }
      }
      const { error } = await supabase.from('news').delete().eq('id', n.id);
      if (!error) newsDeleted++;
    }
  }
  console.log(`✅ news cleaned: ${newsDeleted} deleted, ${imgRemoved} images removed from storage`);

  // ============ 3. Scan team logos ============
  const { data: teams } = await supabase.from('teams').select('id, name, logo_url');
  console.log(`\n🖼️  Scanning ${teams ? teams.length : 0} team logos...`);
  const brokenLogos = [];
  let checked = 0;
  const CONCURRENCY = 12;
  const queue = (teams || []).filter((t) => t.logo_url);
  for (let i = 0; i < queue.length; i += CONCURRENCY) {
    const batch = queue.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((t) => checkUrl(t.logo_url)));
    results.forEach((res, j) => {
      checked++;
      const t = batch[j];
      if (!res.ok || !res.ct.startsWith('image/')) {
        brokenLogos.push({ name: t.name, url: t.logo_url.substring(0, 100), status: res.status, ct: res.ct });
      }
    });
  }
  console.log(`✅ checked ${checked} logos, broken: ${brokenLogos.length}`);
  brokenLogos.forEach((b) => console.log('  ❌', b.name, '|', b.status, b.ct, '|', b.url));

  // ============ 4. Scan recent news images (last 15 days, up to 200) ============
  const { data: recentNews } = await supabase
    .from('news')
    .select('id, slug, image_url')
    .gte('published_at', cutoff15)
    .order('published_at', { ascending: false })
    .limit(200);
  const newsImgs = (recentNews || []).filter((n) => n.image_url);
  const brokenNews = [];
  for (let i = 0; i < newsImgs.length; i += CONCURRENCY) {
    const batch = newsImgs.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((n) => checkUrl(n.image_url)));
    results.forEach((res, j) => {
      const n = batch[j];
      if (!res.ok || !res.ct.startsWith('image/')) {
        brokenNews.push({ slug: n.slug, url: n.image_url.substring(0, 100), status: res.status, ct: res.ct });
      }
    });
  }
  console.log(`🖼️  checked ${newsImgs.length} news images, broken: ${brokenNews.length}`);
  brokenNews.forEach((b) => console.log('  ❌', b.slug, '|', b.status, b.ct, '|', b.url));

  // ============ Summary ============
  const [{ count: mc }, { count: tc }, { count: lc }, { count: nc }] = await Promise.all([
    supabase.from('matches').select('id', { count: 'exact' }),
    supabase.from('teams').select('id', { count: 'exact' }),
    supabase.from('leagues').select('id', { count: 'exact' }),
    supabase.from('news').select('id', { count: 'exact' }),
  ]);
  console.log(`\n📊 ===== التقرير =====`);
  console.log(`matches: ${mc} | teams: ${tc} | leagues: ${lc} | news: ${nc}`);
  console.log(`broken team logos: ${brokenLogos.length} | broken news images: ${brokenNews.length}`);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
