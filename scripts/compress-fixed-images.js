// Compress the newly uploaded large images (>1MB) with sharp, re-upload, update DB
const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const i = l.indexOf('='); if (i > 0) { process.env[l.slice(0, i).trim()] = l.slice(i + 1).trim(); } });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const sharp = require('sharp');

const IDS = [
  'a561ee22-34d1-498e-9b4b-05b638b174e5',
  'f6625129-f8e0-4029-ba26-92db403bcb2b',
  '23989aeb-ceb7-403a-86f3-e7d60690abad',
  '48042274-ef03-4349-b5e1-0db127be7626',
];

(async () => {
  for (const id of IDS) {
    const { data: news } = await sup.from('news').select('id, title, image_url').eq('id', id).single();
    if (!news?.image_url) continue;
    const res = await fetch(news.image_url, { signal: AbortSignal.timeout(20000) });
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length <= 1024 * 1024) { console.log('⏭️', news.title.substring(0, 40), (buf.length / 1024).toFixed(0) + 'KB — already ok'); continue; }
    const compressed = await sharp(buf, { failOn: 'none' }).rotate().resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    console.log('🗜️', news.title.substring(0, 40), (buf.length / 1024 / 1024).toFixed(2) + 'MB →', (compressed.length / 1024 / 1024).toFixed(2) + 'MB');
    const fileName = `news-fix-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.jpg`;
    const { error: ue } = await sup.storage.from('news-images').upload(fileName, compressed, { contentType: 'image/jpeg', upsert: true });
    if (ue) { console.log('❌ upload:', ue.message); continue; }
    const { data: urlData } = sup.storage.from('news-images').getPublicUrl(fileName);
    const { error: dbe } = await sup.from('news').update({ image_url: urlData.publicUrl }).eq('id', id);
    const oldName = news.image_url.split('/').pop();
    await sup.storage.from('news-images').remove([oldName]);
    console.log(dbe ? '❌ db:' + dbe.message : '✅ updated + old deleted');
  }
  console.log('Done');
})();
