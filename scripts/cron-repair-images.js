/**
 * REPAIR: re-download missing news images + delete non-sports rows
 * 1. For each news row whose image_url file is missing from storage:
 *    - find the article in RSS feeds by title
 *    - download its image and upload under the EXACT referenced filename (upsert)
 *    - verify 200
 * 2. Delete non-sports rows that slipped the filter
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const PROJECT_DIR = process.env.CRON_WORKDIR || process.cwd();
try { process.chdir(PROJECT_DIR); } catch (e) { console.error('chdir fail', PROJECT_DIR); process.exit(1); }
const nodeModulesPath = path.join(PROJECT_DIR, 'node_modules');
if (fs.existsSync(nodeModulesPath)) module.paths.unshift(nodeModulesPath);
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseKey);

const RSS_FEEDS = [
  { name: 'WinWin', url: 'https://www.winwin.com/rss' },
  { name: 'SkyNews Sports', url: 'https://www.skynewsarabia.com/rss/sport.xml' },
  { name: 'RT Arabic', url: 'https://arabic.rt.com/rss/' },
];

function decodeEntities(s) {
  return (s || '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ').trim();
}

async function parseRSS(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let m;
    while ((m = itemRegex.exec(xml)) !== null) {
      const itemXml = m[1];
      const title = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim();
      let image = itemXml.match(/<media:content[^>]*url="([^"]+)"/i)?.[1];
      if (!image) image = itemXml.match(/<enclosure[^>]*url="([^"]+)"/i)?.[1];
      if (!image) image = itemXml.match(/<media:thumbnail[^>]*url="([^"]+)"/i)?.[1];
      if (title) items.push({ title: decodeEntities(title), image });
    }
    return items;
  } catch (e) { return []; }
}

function norm(s) { return s.replace(/\s+/g, ' ').replace(/["'«»]/g, '').trim().toLowerCase(); }

// Non-sports rows to DELETE (slipped the filter)
const NON_SPORTS_KEYWORDS = [
  'مفاعلات', 'نووية', 'المهاجرين', 'مهاجرين', 'العتاد العسكري', 'مجلس الشيوخ',
  'التجارة الحرة', 'أعمال شغب', 'التحية النازية', 'متطرفون', 'السودان',
];

async function main() {
  console.log('📥 Fetching RSS feeds for image repair...');
  const feedItems = [];
  for (const feed of RSS_FEEDS) {
    const items = await parseRSS(feed.url);
    feedItems.push(...items);
    console.log(`  ${feed.name}: ${items.length} items`);
  }
  // Build title lookup (normalized)
  const byTitle = new Map();
  for (const it of feedItems) {
    const key = norm(it.title);
    if (!byTitle.has(key)) byTitle.set(key, it);
  }

  const missing = JSON.parse(fs.readFileSync('scripts/_missing-images.json', 'utf-8'));
  const BASE = `https://${supabaseUrl.replace('https://', '')}/storage/v1/object/public/news-images/`;

  let fixed = 0, failed = 0, deleted = 0;

  for (const row of missing) {
    const title = row.title || '';
    const lower = title.toLowerCase();

    // 1) Delete non-sports rows
    if (NON_SPORTS_KEYWORDS.some(k => lower.includes(k))) {
      const { error } = await supabase.from('news').delete().eq('id', row.id);
      if (error) { console.log(`❌ delete failed: ${error.message}`); failed++; }
      else { deleted++; console.log(`🗑️  deleted NON-SPORTS: ${title.substring(0, 55)}`); }
      continue;
    }

    // 2) Repair image — find in RSS by title
    const item = byTitle.get(norm(title));
    if (!item || !item.image) {
      console.log(`⚠️  no RSS match for: ${title.substring(0, 50)}`);
      failed++;
      continue;
    }

    const file = row.image_url.split('/news-images/')[1];
    if (!file) { failed++; continue; }

    try {
      const resp = await fetch(item.image, { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' } });
      if (!resp.ok) { console.log(`⚠️  download ${resp.status}: ${title.substring(0, 45)}`); failed++; continue; }
      let buf = Buffer.from(await resp.arrayBuffer());
      if (buf.length > 4 * 1024 * 1024) { console.log(`⚠️  too large: ${title.substring(0, 45)}`); failed++; continue; }
      // magic bytes check
      const isJpeg = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
      const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
      if (!isJpeg && !isPng) { console.log(`⚠️  not image: ${title.substring(0, 45)}`); failed++; continue; }

      const { error: upErr } = await supabase.storage.from('news-images').upload(file, buf, { upsert: true, contentType: isPng ? 'image/png' : 'image/jpeg' });
      if (upErr) { console.log(`❌ upload err: ${upErr.message} | ${file}`); failed++; continue; }

      // verify
      const chk = await fetch(BASE + file, { method: 'HEAD' });
      if (chk.ok) { fixed++; console.log(`✅ FIXED (${chk.status}): ${title.substring(0, 50)}`); }
      else { console.log(`⚠️  verify ${chk.status}: ${file}`); failed++; }
    } catch (e) { console.log(`❌ err: ${e.message} | ${title.substring(0, 40)}`); failed++; }
  }

  console.log(`\n📊 RESULT — fixed: ${fixed}, failed: ${failed}, deleted(non-sports): ${deleted}`);
}
main().catch(e => { console.error('FATAL', e.message); process.exit(1); });
