// ترحيل 133 صورة خارجية (assets.winwin.com) إلى Supabase Storage
// القاعدة الإلزامية: image_url يجب أن يكون رابط Supabase Storage فقط
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const supabase = createClient(
  env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim(),
  env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()
);

const LOG = 'scripts/migrate-images.log';
function log(msg) { fs.appendFileSync(LOG, new Date().toISOString() + ' ' + msg + '\n'); console.log(msg); }

function looksLikeImage(buf) {
  if (buf.length < 16) return false;
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true;
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return true;
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return true;
  return false;
}

async function migrateOne(n, idx, total) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(n.image_url, {
        signal: AbortSignal.timeout(45000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
          'Accept': 'image/*,*/*;q=0.8',
          'Referer': 'https://www.winwin.com/',
          'Cache-Control': 'no-cache',
        },
      });
      if (!res.ok) { log(`[${idx}/${total}] ❌ HTTP ${res.status} (محاولة ${attempt}/3): ${n.title.substring(0, 40)}`); if (attempt < 3) { await new Promise(r => setTimeout(r, 1500 * attempt)); continue; } return false; }
      let buf = Buffer.from(await res.arrayBuffer());
      if (!looksLikeImage(buf)) { log(`[${idx}/${total}] ❌ ترويسة فاسدة: ${n.title.substring(0, 40)} (${buf.subarray(0,6).toString('hex')})`); return false; }
      try {
        const sharp = require('sharp');
        if (buf.length > 300 * 1024) {
          const c = await sharp(buf, { failOn: 'none' }).rotate().resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
          if (c.length < buf.length) buf = c;
        }
      } catch (e) { /* sharp غير متاح */ }

      const ext = n.image_url.match(/\.(jpe?g|png|gif|webp)/i)?.[1]?.toLowerCase() || 'jpg';
      const fileName = `news-${n.id.substring(0, 8)}-${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext}`;
      const { error: upErr } = await supabase.storage.from('news-images').upload(fileName, buf, { contentType: 'image/jpeg', upsert: true });
      if (upErr) { log(`[${idx}/${total}] ❌ رفع: ${upErr.message}: ${n.title.substring(0, 40)}`); return false; }
      const publicUrl = supabase.storage.from('news-images').getPublicUrl(fileName).data.publicUrl;
      const { error: dbErr } = await supabase.from('news').update({ image_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', n.id);
      if (dbErr) { log(`[${idx}/${total}] ❌ DB: ${dbErr.message}: ${n.title.substring(0, 40)}`); return false; }
      log(`[${idx}/${total}] ✅ ${n.title.substring(0, 50)} → ${fileName}`);
      return true;
    } catch (e) {
      log(`[${idx}/${total}] ⚠️ ERR ${e.message} (محاولة ${attempt}/3): ${n.title.substring(0, 40)}`);
      if (attempt < 3) { await new Promise(r => setTimeout(r, 2000 * attempt)); continue; }
      return false;
    }
  }
  return false;
}

async function main() {
  fs.writeFileSync(LOG, '');
  let all = [];
  let from = 0;
  while (true) {
    const { data } = await supabase.from('news').select('id,title,image_url').range(from, from + 499);
    if (!data || !data.length) break;
    all = all.concat(data); from += 500;
    if (data.length < 500) break;
  }
  const external = all.filter(n => n.image_url && !n.image_url.includes('supabase.co'));
  log(`إجمالي: ${all.length} | خارجية: ${external.length}`);
  let ok = 0;
  for (let i = 0; i < external.length; i++) {
    const r = await migrateOne(external[i], i + 1, external.length);
    if (r) ok++;
  }
  log(`\n🏁 تم: ${ok}/${external.length} بنجاح`);
}
main();
