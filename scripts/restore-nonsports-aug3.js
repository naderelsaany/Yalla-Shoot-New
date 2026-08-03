/**
 * Restore 6 football news items wrongly deleted by over-broad patterns
 * (طلاق matched انطلاق, انتخابات/النصب matched club-election/gossip contexts).
 * Re-fetch from RSS feeds by distinctive keyword and re-insert with Supabase image.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const PROJECT_DIR = process.cwd();
const env = fs.readFileSync(path.join(PROJECT_DIR, '.env.local'), 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET = 'news-images';

// (distinctive keyword, title) — match a feed item by keyword to restore
const RESTORE = [
  'زامبيا',          // هزيمة ساحقة.. زامبيا
  'ميدو',            // ميدو يثير الجدل حول عملية النصب في الزمالك
  'السوباط',        // هشام السوباط رئيس الهلال السوداني
  'سيكافا',         // قائد الهلال السوداني قبل سيكافا
  'مونديال 2030',  // 6 منتخبات تضمن مقاعدها في مونديال 2030
  'الفيصلي',       // الدوري الأردني
];

const FEEDS = [
  'https://www.winwin.com/rss',
  'https://www.skynewsarabia.com/rss/sport.xml',
  'https://arabic.rt.com/rss/',
];

function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRegex.exec(xml)) !== null) {
    const x = m[1];
    const title = x.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim();
    const desc = x.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim();
    let image = x.match(/<media:content[^>]*url="([^"]+)"|enclosure[^>]*url="([^"]+)"|media:thumbnail[^>]*url="([^"]+)"/i);
    const pubDate = x.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1];
    if (title) items.push({ title, description: desc || '', image: image ? (image[1] || image[2] || image[3]) : '', pubDate });
  }
  return items;
}

function cleanTitle(t) {
  return (t || '').replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ').trim();
}
function cleanDesc(d) {
  return (d || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '')
    .replace(/&[^;]+;/g, ' ').trim().substring(0, 500);
}
function slug(t) {
  const safe = t.replace(/[^\w\u0600-\u06FF\s-]/g, '').trim().replace(/\s+/g, '-').substring(0, 80);
  const h = crypto.createHash('md5').update(t).digest('hex').substring(0, 8);
  return safe + '-' + h;
}

async function dlUpload(img, title) {
  try {
    const res = await fetch(img, { signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    let buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 4 * 1024 * 1024) return null;
    const isJ = buf[0]===0xFF&&buf[1]===0xD8&&buf[2]===0xFF;
    const isP = buf[0]===0x89&&buf[1]===0x50&&buf[2]===0x4E&&buf[3]===0x47;
    if (!isJ && !isP) return null;
    const ext = img.includes('.png') ? 'png' : 'jpg';
    const name = `news-restore-${crypto.createHash('md5').update(title).digest('hex').substring(0,8)}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(name, buf, { contentType: ext === 'png' ? 'image/png' : 'image/jpeg', upsert: true });
    if (error) return null;
    return supabase.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
  } catch (e) { return null; }
}

async function main() {
  // existing titles to avoid dup
  const { data: ex } = await supabase.from('news').select('title').limit(5000);
  const existingTitles = new Set((ex || []).map(n => n.title.trim().toLowerCase()));

  const items = [];
  for (const f of FEEDS) {
    try {
      const res = await fetch(f, { signal: AbortSignal.timeout(15000) });
      if (res.ok) items.push(...parseRSS(await res.text()));
    } catch (e) {}
  }

  let restored = 0;
  for (const kw of RESTORE) {
    const it = items.find(i => (i.title + ' ' + cleanDesc(i.description)).includes(kw));
    if (!it) { console.log('  ⏭️ not in feed:', kw); continue; }
    const t = cleanTitle(it.title);
    if (existingTitles.has(t.toLowerCase())) { console.log('  ⏭️ already exists:', t.substring(0,50)); continue; }
    const img = it.image && (await dlUpload(it.image, t));
    const pd = it.pubDate ? new Date(it.pubDate) : new Date();
    const d = cleanDesc(it.description);
    const { error } = await supabase.from('news').insert({ title: t.substring(0,200), slug: slug(t), content: d, image_url: img, published_at: isNaN(pd) ? new Date().toISOString() : pd.toISOString(), summary: d.substring(0,160), is_featured: false });
    if (error) { console.log('  ❌ insert fail:', kw, error.message); continue; }
    restored++;
    console.log('  ✅ restored:', t.substring(0,55), '| img:', !!img);
  }
  console.log(`\nRestored: ${restored}/${RESTORE.length}`);
  const { count } = await supabase.from('news').select('id', { count: 'exact' });
  console.log('news now:', count);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });