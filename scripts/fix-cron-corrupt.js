// إصلاح 3 صور تالفة أدرجها الكود القديم (08:37) قبل اكتمال الـ deploy
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const supabase = createClient(
  env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim(),
  env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()
);
const sharp = require('sharp');

const FIXES = [
  ['الهلال يصعد قضية نهضة بركان بعد قرار صادم من الكاف', 'https://assets.winwin.com/2026-08/image-1785572140.jpg'],
  ['الاتحاد الآسيوي يوجه رسالة للفيفا بعد انهيار مشروع إنفانتينو', 'https://assets.winwin.com/2026-08/image-1785571289.jpeg'],
  ['الأهلي السعودي يتفق مع مدرب فياريال السابق لخلافة يايسله', 'https://assets.winwin.com/2026-08/image-1785570838.jpg'],
];

(async () => {
  for (const [title, srcUrl] of FIXES) {
    console.log('===', title.substring(0, 50));
    const { data: news } = await supabase.from('news').select('id,title,image_url').ilike('title', title).maybeSingle();
    if (!news) { console.log('  ❌ غير موجود'); continue; }
    const r = await fetch(srcUrl, { signal: AbortSignal.timeout(45000), headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120.0', 'Referer': 'https://www.winwin.com/' } });
    if (!r.ok) { console.log('  ❌ HTTP', r.status); continue; }
    let buf = Buffer.from(await r.arrayBuffer());
    console.log('  تحميل:', (buf.length / 1024).toFixed(0) + 'KB', '| magic:', buf.subarray(0, 4).toString('hex'));
    if (buf.length > 300 * 1024) {
      const c = await sharp(buf, { failOn: 'none' }).rotate().resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
      console.log('  ضغط:', (buf.length / 1024).toFixed(0) + 'KB →', (c.length / 1024).toFixed(0) + 'KB');
      buf = c;
    }
    const fileName = news.image_url.split('/').pop();
    const { error: upErr } = await supabase.storage.from('news-images').upload(fileName, buf, { contentType: 'image/jpeg', upsert: true });
    if (upErr) { console.log('  ❌ رفع:', upErr.message); continue; }
    console.log('  ✅ تم إصلاح', fileName);
  }
})();
