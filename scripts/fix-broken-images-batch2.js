// إصلاح 4 صور تالفة إضافية (الدفعة الثانية)
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseKey);

function looksLikeImage(buf) {
  if (buf.length < 16) return false;
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true;
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return true;
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return true;
  return false;
}

// (عنوان، رابط مصدر أو null لإعادة استخدام صورة موجودة)
const FIXES = [
  ['هل انتهت الأزمة؟.. بونو يرمي الكرة في ملعب الهلال السعودي', 'https://assets.winwin.com/2026-08/image-1785536156.jpeg'],
  ['عرض إيطالي يربك حسابات الأهلي في صفقة عمر فايد', 'https://assets.winwin.com/2026-08/image-1785532267.jpeg'],
  ['من العقوبة إلى الاتفاق.. كيف انتهت أزمة كانسيلو مع الهلال؟', 'https://assets.winwin.com/2026-08/image-1785534758.jpeg'],
  ['هل تغير ثنائية حمزة عبد الكريم مكانته في برشلونة؟', null], // يستخدم صورة حمزة العاملة
];
const REUSE_URL = 'https://ynqvcexiolbqztnwkrbd.supabase.co/storage/v1/object/public/news-images/news-47bcad56-1785558136906.jpeg'; // الملك المصري (سليمة)

async function main() {
  for (const [title, srcUrl] of FIXES) {
    console.log(`\n=== ${title.substring(0, 55)} ===`);
    const { data: news } = await supabase.from('news').select('id, title, image_url').ilike('title', title).maybeSingle();
    if (!news) { console.log('❌ غير موجود'); continue; }

    if (!srcUrl) {
      // إعادة استخدام صورة سليمة
      const { error } = await supabase.from('news').update({ image_url: REUSE_URL, updated_at: new Date().toISOString() }).eq('id', news.id);
      console.log(error ? `❌ ${error.message}` : `✅ استخدمت صورة بديلة: ${REUSE_URL.split('/').pop()}`);
      continue;
    }

    const res = await fetch(srcUrl, { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120.0', 'Accept': 'image/*,*/*;q=0.8' } });
    if (!res.ok) { console.log(`❌ HTTP ${res.status}`); continue; }
    let buf = Buffer.from(await res.arrayBuffer());
    if (!looksLikeImage(buf)) { console.log(`❌ مصدر غير صالح: ${buf.subarray(0,8).toString('hex')}`); continue; }

    try {
      const sharp = require('sharp');
      if (buf.length > 300 * 1024) {
        const compressed = await sharp(buf, { failOn: 'none' }).rotate().resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
        if (compressed.length < buf.length) { console.log(`🗜️ ${(buf.length/1024).toFixed(0)}KB → ${(compressed.length/1024).toFixed(0)}KB`); buf = compressed; }
      }
    } catch (e) { console.log('⚠️ sharp:', e.message); }

    const oldName = news.image_url?.split('/').pop();
    const fileName = oldName && oldName.startsWith('news-') ? oldName : `news-${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage.from('news-images').upload(fileName, buf, { contentType: 'image/jpeg', upsert: true });
    if (upErr) { console.log(`❌ رفع: ${upErr.message}`); continue; }
    const publicUrl = supabase.storage.from('news-images').getPublicUrl(fileName).data.publicUrl;
    const { error: dbErr } = await supabase.from('news').update({ image_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', news.id);
    console.log(dbErr ? `❌ DB: ${dbErr.message}` : `✅ تم الإصلاح: ${fileName}`);
  }
}
main();
