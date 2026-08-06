// Fix 3 corrupt news images (bad magic efbfbdef — error page saved as .jpg)
// Re-download from WinWin originals, upload fresh, update DB, delete corrupt files
const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const i = l.indexOf('='); if (i > 0) { process.env[l.slice(0, i).trim()] = l.slice(i + 1).trim(); } });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const FIXES = [
  { title: 'وكيل عبد الله السعيد يتحدث بعد أزمة الغياب عن معسكر الزمالك', url: 'https://assets.winwin.com/2026-08/image-1786024344.jpeg' },
  { title: 'منافس مولودية الجزائر في الدور التمهيدي بدوري أبطال أفريقيا', url: 'https://assets.winwin.com/2026-08/image-1786021509.jpg' },
  { title: 'حلم النجمة السادسة.. معتمد جمال يتحدى أزمات الزمالك', url: 'https://assets.winwin.com/2026-08/image-1786022738.jpg' },
];

function validImage(buf) {
  if (buf.length > 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'jpeg';
  if (buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'png';
  if (buf.length > 3 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'gif';
  if (buf.length > 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  return null;
}

(async () => {
  for (const fix of FIXES) {
    const { data: news, error: ne } = await sup.from('news').select('id, title, image_url').eq('title', fix.title).order('published_at', { ascending: false }).limit(1);
    if (ne || !news || news.length === 0) { console.log('❌ news not found:', fix.title); continue; }
    const item = news[0];
    console.log('\n🔧', item.title.substring(0, 60));
    console.log('   old image_url:', item.image_url);

    // 1. Download
    let res;
    try {
      res = await fetch(fix.url, { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36', 'Referer': 'https://www.winwin.com/' } });
    } catch (e) { console.log('   ❌ download error:', e.message); continue; }
    if (!res.ok) { console.log('   ❌ HTTP', res.status); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = validImage(buf);
    if (!ext) { console.log('   ❌ INVALID MAGIC:', buf.subarray(0, 8).toString('hex'), 'size', buf.length); continue; }
    console.log(`   ✅ downloaded ${ext} ${(buf.length / 1024).toFixed(0)}KB magic=${buf.subarray(0, 4).toString('hex')}`);

    // 2. Upload fresh
    const fileName = `news-fix-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
    const { error: ue } = await sup.storage.from('news-images').upload(fileName, buf, { contentType: `image/${ext}`, upsert: true });
    if (ue) { console.log('   ❌ upload error:', ue.message); continue; }
    const { data: urlData } = sup.storage.from('news-images').getPublicUrl(fileName);
    console.log('   ✅ uploaded:', fileName);

    // 3. Update DB
    const { error: dbe } = await sup.from('news').update({ image_url: urlData.publicUrl }).eq('id', item.id);
    if (dbe) { console.log('   ❌ db update error:', dbe.message); continue; }
    console.log('   ✅ DB updated');

    // 4. Delete old corrupt file
    if (item.image_url) {
      const oldName = item.image_url.split('/').pop();
      if (oldName && oldName.startsWith('news-')) {
        const { error: de } = await sup.storage.from('news-images').remove([oldName]);
        console.log(de ? `   ⚠️ old file delete error: ${de.message}` : `   ✅ deleted old corrupt file: ${oldName}`);
      }
    }
  }
  console.log('\n✅ Done');
})();
