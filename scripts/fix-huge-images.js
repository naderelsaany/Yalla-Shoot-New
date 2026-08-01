// إصلاح آخر 3 صور خارجية — ملفات ضخمة (14-40MB) تحتاج مهلة أطول + ضغط
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const supabase = createClient(
  env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim(),
  env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()
);
const sharp = require('sharp');

(async () => {
  const { data } = await supabase.from('news')
    .select('id,title,image_url')
    .not('image_url', 'like', '%supabase.co%')
    .not('image_url', 'is', null)
    .limit(10);
  for (const n of data || []) {
    console.log('===', n.title.substring(0, 50));
    let buf = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const r = await fetch(n.image_url, {
          signal: AbortSignal.timeout(120000),
          headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120.0', 'Referer': 'https://www.winwin.com/' },
        });
        if (!r.ok) { console.log('  HTTP', r.status); break; }
        buf = Buffer.from(await r.arrayBuffer());
        console.log('  تحميل:', (buf.length / 1048576).toFixed(1) + 'MB');
        break;
      } catch (e) { console.log('  محاولة', attempt, 'ERR:', e.message); await new Promise(res => setTimeout(res, 3000 * attempt)); }
    }
    if (!buf) { console.log('  ❌ فشل'); continue; }

    // ضغط قوي إلى أقصى عرض 1280
    try {
      const c = await sharp(buf, { failOn: 'none' }).rotate().resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
      console.log('  ضغط:', (buf.length / 1048576).toFixed(1) + 'MB →', (c.length / 1024).toFixed(0) + 'KB');
      buf = c;
    } catch (e) { console.log('  ⚠️ sharp:', e.message); }

    const fileName = `news-${n.id.substring(0, 8)}-${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage.from('news-images').upload(fileName, buf, { contentType: 'image/jpeg', upsert: true });
    if (upErr) { console.log('  ❌ رفع:', upErr.message); continue; }
    const publicUrl = supabase.storage.from('news-images').getPublicUrl(fileName).data.publicUrl;
    const { error: dbErr } = await supabase.from('news').update({ image_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', n.id);
    console.log(dbErr ? '  ❌ DB: ' + dbErr.message : '  ✅ ' + fileName);
  }
})();
