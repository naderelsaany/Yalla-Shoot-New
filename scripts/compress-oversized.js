// ضغط صورة 2.2MB + حذف خبر كرة السلة (خارج تخصص الموقع)
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const supabase = createClient(
  env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim(),
  env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()
);
(async () => {
  const { data } = await supabase.from('news')
    .select('id,title,image_url')
    .ilike('title', '%دوري السلة%')
    .limit(5);
  for (const n of data || []) {
    console.log('خبر:', n.title.substring(0, 60));
    const r = await fetch(n.image_url, { signal: AbortSignal.timeout(15000) });
    let buf = Buffer.from(await r.arrayBuffer());
    console.log('  الحجم الحالي:', (buf.length / 1048576).toFixed(2) + 'MB');
    try {
      const sharp = require('sharp');
      const c = await sharp(buf).rotate().resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
      console.log('  مضغوطة إلى:', (c.length / 1024).toFixed(0) + 'KB');
      const fileName = n.image_url.split('/').pop();
      const { error } = await supabase.storage.from('news-images').upload(fileName, c, { contentType: 'image/jpeg', upsert: true });
      console.log(error ? '  ❌ ' + error.message : '  ✅ تم استبدالها بالنسخة المضغوطة');
    } catch (e) { console.log('  ⚠️', e.message); }
  }
})();
