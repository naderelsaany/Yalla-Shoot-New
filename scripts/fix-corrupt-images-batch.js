/**
 * Fix 13 mojibake-corrupt news images (EF BF BD U+FFFD)
 * Replacement strategy per skill rule (club news → club logo):
 *  - Club/team news → team badge (TheSportsDB)
 *  - League news → league badge
 *  - FIFA news → FIFA logo (Wikimedia)
 *  - Fan-chase video news → stadium crowd image (Wikimedia)
 * Cron: 2026-08-06
 */
const path = require('path');
const fs = require('fs');
const PROJECT_DIR = process.env.CRON_WORKDIR || process.cwd();
try { process.chdir(PROJECT_DIR); } catch (e) {}
const nm = path.join(PROJECT_DIR, 'node_modules');
if (fs.existsSync(nm)) module.paths.unshift(nm);
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync(path.join(PROJECT_DIR, '.env.local'), 'utf-8');
const sup = createClient(
  env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim(),
  env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()
);

// old filename → replacement image URL
const REPLACEMENTS = [
  ['news-6f71f2e8-1785675804642.jpg', 'https://r2.thesportsdb.com/images/media/team/badge/74vpne1727195727.png'], // الميناء (Syrian trio)
  ['news-d5668978-1785675806152.jpg', 'https://r2.thesportsdb.com/images/media/team/badge/vwvwrw1473502969.png'], // ريال مدريد
  ['news-c1d6feef-1785675808231.jpg', 'https://r2.thesportsdb.com/images/media/team/badge/tgekj81580930027.png'], // الزمالك
  ['news-f33b1a35-1785732388052.jpg', 'https://r2.thesportsdb.com/images/media/team/badge/rrwpry1455460218.png'], // الجزائر
  ['news-359e44d1-1785732390968.jpg', 'https://r2.thesportsdb.com/images/media/team/badge/rrwpry1455460218.png'], // الجزائر سيدات
  ['news-d00d3700-1785732392654.jpg', 'https://r2.thesportsdb.com/images/media/league/badge/gasy9d1737743125.png'], // الدوري الإنجليزي
  ['news-2980347c-1785762435750.jpg', 'https://r2.thesportsdb.com/images/media/team/badge/csvbqw1753934121.png'], // الترجي
  ['news-6d06fc66-1785762438046.jpg', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/London_Stadium_crowd_control.jpg/500px-London_Stadium_crowd_control.jpg'], // مشجع في المدرجات
  ['news-63ab8fe9-1785904753920.jpg', 'https://r2.thesportsdb.com/images/media/team/badge/96s34o1776827629.png'], // طرابزون (صلاح)
  ['news-8740e48a-1785904756002.jpg', 'https://r2.thesportsdb.com/images/media/team/badge/96s34o1776827629.png'], // طرابزون (راتب صلاح)
  ['news-0698cdf7-1785904758154.png', 'https://r2.thesportsdb.com/images/media/team/badge/96s34o1776827629.png'], // طرابزون (كيف تشاهد)
  ['news-1d48d263-1785904762196.jpg', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/FIFA_logo_without_slogan.svg/330px-FIFA_logo_without_slogan.svg.png'], // الفيفا
  ['news-48bac8ce-1785904763463.jpg', 'https://r2.thesportsdb.com/images/media/team/badge/96s34o1776827629.png'], // طرابزون (انتقال صلاح)
];

function validImage(buf) {
  if (buf.length > 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'jpg';
  if (buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'png';
  if (buf.length > 3 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'gif';
  return null;
}

(async () => {
  for (const [oldName, newUrl] of REPLACEMENTS) {
    // find news row by image_url
    const { data: newsList } = await sup.from('news').select('id, title, image_url').ilike('image_url', `%${oldName}`);
    const news = newsList && newsList[0];
    if (!news) { console.log(`❌ news not found for ${oldName}`); continue; }
    console.log(`\n🔧 ${news.title?.substring(0, 55)}`);
    console.log(`   old: ${oldName}`);

    // 1. download replacement
    let res;
    try {
      res = await fetch(newUrl, { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 Safari/537.36' } });
    } catch (e) { console.log(`   ❌ download error: ${e.message}`); continue; }
    if (!res.ok) { console.log(`   ❌ HTTP ${res.status}`); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = validImage(buf);
    if (!ext) { console.log(`   ❌ invalid magic: ${buf.subarray(0, 4).toString('hex')} size=${buf.length}`); continue; }
    console.log(`   ✅ downloaded ${ext} ${(buf.length / 1024).toFixed(0)}KB`);

    // 2. upload fresh
    const newName = `news-fix-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
    const { error: ue } = await sup.storage.from('news-images').upload(newName, buf, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true });
    if (ue) { console.log(`   ❌ upload: ${ue.message}`); continue; }
    const { data: urlData } = sup.storage.from('news-images').getPublicUrl(newName);

    // 3. update DB
    const { error: dbe } = await sup.from('news').update({ image_url: urlData.publicUrl }).eq('id', news.id);
    if (dbe) { console.log(`   ❌ db: ${dbe.message}`); continue; }
    console.log(`   ✅ DB updated → ${newName}`);

    // 4. delete corrupt old
    const { error: de } = await sup.storage.from('news-images').remove([oldName]);
    console.log(de ? `   ⚠️ old delete: ${de.message}` : `   ✅ deleted corrupt old`);
  }
  console.log('\n✅ Done');
})();
