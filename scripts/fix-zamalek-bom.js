/** Targeted fix: Zamalek news BOM-corrupt image (news-51b7d509-1785972513418.jpg) */
const path = require('path');
const fs = require('fs');
const PROJECT_DIR = process.env.CRON_WORKDIR || process.cwd();
try { process.chdir(PROJECT_DIR); } catch (e) {}
const nm = path.join(PROJECT_DIR, 'node_modules');
if (fs.existsSync(nm)) module.paths.unshift(nm);
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync(path.join(PROJECT_DIR, '.env.local'), 'utf-8');
const sup = createClient(
  env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim(),
  env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()
);

(async () => {
  const NEWS_ID = 'a901f0ed-35fc-400c-b573-6387c20d1a76';
  const { data: news, error: ne } = await sup.from('news').select('id, title, image_url').eq('id', NEWS_ID).single();
  if (ne || !news) { console.log('❌ news not found', ne?.message); return; }
  console.log('🔧', news.title?.substring(0, 60));
  const fn = news.image_url.split('/').pop();
  const { data, error } = await sup.storage.from('news-images').download(fn);
  if (error) { console.log('❌ download error:', error.message); return; }
  let buf = Buffer.from(await data.arrayBuffer());
  console.log('orig size:', buf.length, 'first:', buf.subarray(0, 4).toString('hex'));
  const isBom = buf.length > 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
  if (isBom) buf = buf.subarray(3);
  const isJpeg = buf.length > 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
  console.log('after strip: size:', buf.length, 'first:', buf.subarray(0, 4).toString('hex'), 'jpeg:', isJpeg);
  if (!isJpeg) { console.log('❌ still not jpeg'); return; }

  const newName = `news-fix-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.jpg`;
  const { error: ue } = await sup.storage.from('news-images').upload(newName, buf, { contentType: 'image/jpeg', upsert: true });
  if (ue) { console.log('❌ upload error:', ue.message); return; }
  const { data: urlData } = sup.storage.from('news-images').getPublicUrl(newName);
  const { error: dbe } = await sup.from('news').update({ image_url: urlData.publicUrl }).eq('id', NEWS_ID);
  if (dbe) { console.log('❌ db error:', dbe.message); return; }
  console.log('✅ DB updated →', urlData.publicUrl);
  const { error: de } = await sup.storage.from('news-images').remove([fn]);
  console.log(de ? `⚠️ old file delete: ${de.message}` : `✅ deleted old corrupt: ${fn}`);
})();
