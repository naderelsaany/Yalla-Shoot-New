// إصلاح 3 صور أخبار تالفة — إعادة تحميل من WinWin CDN والتحقق من الترويسة ثم الرفع
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const crypto = require('crypto');

const env = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseKey);

// (عنوان الخبر، رابط الصورة الأصلي من WinWin RSS)
const FIXES = [
  ['ماذا قال فليك عن حمزة عبد الكريم بعد ثنائيته مع برشلونة؟', 'https://assets.winwin.com/2026-08/image-1785536574.jpeg'],
  ['انتهت القصة.. محمد عمورة يتفق مع ناديه الجديد', 'https://assets.winwin.com/2026-08/image-1785534619.jpg'],
  ['الملك المصري.. جماهير برشلونة تتغنى بثنائية حمزة عبد الكريم', 'https://assets.winwin.com/2026-08/image-1785535610.jpeg'],
];

function looksLikeImage(buf) {
  // JPEG: FF D8 FF | PNG: 89 50 4E 47 | GIF: 47 49 46 | WebP: 52 49 46 46 ... 57 45 42 50
  if (buf.length < 16) return false;
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true;
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return true;
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return true;
  // يرفض الملفات اللي بتبدأ بحروف UTF-8 replacement (EF BF BD) — علامة الفساد
  return false;
}

async function main() {
  for (const [title, srcUrl] of FIXES) {
    console.log(`\n=== ${title.substring(0, 50)} ===`);
    // 1. اعثر على الخبر في DB
    const { data: news } = await supabase.from('news').select('id, title, image_url').ilike('title', title).maybeSingle();
    if (!news) { console.log('❌ الخبر غير موجود في DB'); continue; }
    console.log(`📰 الخبر موجود (id=${news.id}) — الصورة الحالية: ${news.image_url?.split('/').pop()}`);

    // 2. حمّل الصورة من المصدر
    const res = await fetch(srcUrl, {
      signal: AbortSignal.timeout(20000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36', 'Accept': 'image/*,*/*;q=0.8' }
    });
    if (!res.ok) { console.log(`❌ فشل التحميل HTTP ${res.status}`); continue; }
    let buf = Buffer.from(await res.arrayBuffer());
    console.log(`📥 تم التحميل: ${(buf.length/1024).toFixed(0)}KB`);

    // 3. فحص الترويسة
    if (!looksLikeImage(buf)) {
      console.log(`❌ الملف مش صورة صالحة (أول 8 بايت: ${buf.subarray(0,8).toString('hex')})`);
      continue;
    }
    console.log('✅ الترويسة سليمة (JPEG/PNG/GIF/WebP)');

    // 4. ضغط بـ sharp إن أمكن (مش إجباري)
    try {
      const sharp = require('sharp');
      if (buf.length > 300 * 1024) {
        const compressed = await sharp(buf, { failOn: 'none' }).rotate().resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
        if (compressed.length < buf.length) { console.log(`🗜️ مضغوطة: ${(buf.length/1024).toFixed(0)}KB → ${(compressed.length/1024).toFixed(0)}KB`); buf = compressed; }
      }
    } catch (e) { console.log(`⚠️ sharp غير متاح: ${e.message}`); }

    // 5. ارفع لنفس اسم الملف (upsert) — أو اسم جديد
    const oldName = news.image_url?.split('/').pop();
    const fileName = oldName && oldName.startsWith('news-') ? oldName : `news-${crypto.createHash('md5').update(title).digest('hex').substring(0,8)}-${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage.from('news-images').upload(fileName, buf, { contentType: 'image/jpeg', upsert: true });
    if (upErr) { console.log(`❌ فشل الرفع: ${upErr.message}`); continue; }
    console.log(`✅ تم الرفع: ${fileName}`);

    // 6. حدّث DB
    const publicUrl = supabase.storage.from('news-images').getPublicUrl(fileName).data.publicUrl;
    const { error: dbErr } = await supabase.from('news').update({ image_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', news.id);
    console.log(dbErr ? `❌ فشل تحديث DB: ${dbErr.message}` : `✅ تم تحديث image_url: ${publicUrl}`);
  }
}
main();
