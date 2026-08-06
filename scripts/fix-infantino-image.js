// Fix broken image for "رئيس الوزراء الكندي..." news — re-upload relevant image to Supabase Storage
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
fs.readFileSync('.env.local', 'utf-8').split('\n').forEach(l => {
  const i = l.indexOf('='); if (i > 0) process.env[l.slice(0, i)] = l.slice(i + 1);
});
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const WIKI_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Gianni_Infantino_Argentina_v_Spain_19_July_2026-279_%28cropped%29.jpg/500px-Gianni_Infantino_Argentina_v_Spain_19_July_2026-279_%28cropped%29.jpg';
const BROKEN_FILE = 'news-a0828370-1785992528555.jpg';

(async () => {
  // 1. find the news row
  const { data: news, error } = await sup.from('news')
    .select('id, title, image_url')
    .like('title', '%فقدت الثقة برئيس الفيفا%')
    .limit(3);
  if (error || !news || news.length === 0) { console.log('❌ news not found:', error?.message || 'none'); return; }
  const row = news[0];
  console.log('Target news:', row.id, '|', row.title.substring(0, 50));

  // 2. download image
  const res = await fetch(WIKI_URL, { headers: { 'User-Agent': 'YallaShootBot/1.0 (site maintenance)' } });
  if (!res.ok) { console.log('❌ download failed:', res.status); return; }
  const buf = Buffer.from(await res.arrayBuffer());
  console.log('Downloaded:', buf.length, 'bytes,', res.headers.get('content-type'));

  // 3. upload to storage
  const fileName = `news-infantino-${Date.now()}.jpg`;
  const { error: upErr } = await sup.storage.from('news-images').upload(fileName, buf, {
    contentType: 'image/jpeg', upsert: true,
  });
  if (upErr) { console.log('❌ upload failed:', upErr.message); return; }
  const { data: urlData } = sup.storage.from('news-images').getPublicUrl(fileName);
  console.log('✅ Uploaded:', urlData.publicUrl);

  // 4. update DB row
  const { error: updErr } = await sup.from('news').update({ image_url: urlData.publicUrl }).eq('id', row.id);
  if (updErr) { console.log('❌ DB update failed:', updErr.message); return; }
  console.log('✅ DB updated');

  // 5. delete corrupt file
  const { error: delErr } = await sup.storage.from('news-images').remove([BROKEN_FILE]);
  console.log(delErr ? `⚠️ corrupt file delete failed: ${delErr.message}` : '✅ corrupt file deleted');
})();
