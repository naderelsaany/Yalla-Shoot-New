// التحقق النهائي: لا روابط خارجية + لا صور تالفة (عينة شاملة)
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const supabase = createClient(
  env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim(),
  env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()
);
function looksLikeImage(buf) {
  if (buf.length < 16) return false;
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true;
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return true;
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return true;
  return false;
}
(async () => {
  let all = []; let from = 0;
  while (true) {
    const { data } = await supabase.from('news').select('id,title,image_url,published_at').range(from, from + 499);
    if (!data || !data.length) break;
    all = all.concat(data); from += 500;
    if (data.length < 500) break;
  }
  const external = all.filter(n => n.image_url && !n.image_url.includes('supabase.co'));
  const none = all.filter(n => !n.image_url);
  console.log('إجمالي:', all.length, '| خارجي:', external.length, '| بدون صورة:', none.length);

  // فحص الترويسة لكل الصور المخزنة (953 - 44 بلا صورة = ~909) — قد يأخذ دقائق
  const storage = all.filter(n => n.image_url && n.image_url.includes('supabase.co'));
  console.log('فحص الترويسة لـ', storage.length, 'صورة...');
  let bad = [];
  for (let i = 0; i < storage.length; i++) {
    const n = storage[i];
    try {
      const r = await fetch(n.image_url, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) { bad.push(n.title + ' | HTTP ' + r.status); continue; }
      const buf = Buffer.from(await r.arrayBuffer());
      if (!looksLikeImage(buf)) bad.push(n.title + ' | ترويسة ' + buf.subarray(0, 6).toString('hex'));
      if (buf.length > 2 * 1024 * 1024) bad.push(n.title + ' | حجم ضخم ' + (buf.length / 1048576).toFixed(1) + 'MB');
    } catch (e) { bad.push(n.title + ' | ' + e.message.substring(0, 30)); }
    if ((i + 1) % 200 === 0) console.log('  ...', i + 1, '/', storage.length);
  }
  console.log('🏁 تالفة/مشبوهة:', bad.length);
  bad.slice(0, 20).forEach(b => console.log('  ❌', b.substring(0, 85)));
})();
