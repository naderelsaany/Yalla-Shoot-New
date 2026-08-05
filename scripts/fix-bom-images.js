/**
 * Fix BOM-prefixed corrupt news images:
 * - Download file, strip UTF-8 BOM (EF BB BF), validate JPEG magic
 * - Upload fresh to storage, update DB, delete corrupt old file
 * Cron: 2026-08-06 — found news-51b7d509-1785972513418.jpg (Zamalek news)
 */
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

function hasBom(buf) {
  return buf.length > 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
}

async function fixImage(news) {
  const fn = news.image_url.split('/').pop();
  if (!fn || !fn.startsWith('news-')) return 'skip (non news- file)';
  const { data, error } = await sup.storage.from('news-images').download(fn);
  if (error) return `download err: ${error.message}`;
  let buf = Buffer.from(await data.arrayBuffer());
  if (!hasBom(buf)) return 'ok (no BOM)';
  buf = buf.subarray(3); // strip BOM
  const isJpeg = buf.length > 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
  const isPng = buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
  if (!isJpeg && !isPng) return `not image after BOM strip (magic ${buf.subarray(0,4).toString('hex')})`;

  const ext = isJpeg ? 'jpg' : 'png';
  const newName = `news-fix-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
  const { error: ue } = await sup.storage.from('news-images').upload(newName, buf, { contentType: `image/${ext === 'jpg' ? 'jpeg' : 'png'}`, upsert: true });
  if (ue) return `upload err: ${ue.message}`;
  const { data: urlData } = sup.storage.from('news-images').getPublicUrl(newName);
  const { error: dbe } = await sup.from('news').update({ image_url: urlData.publicUrl }).eq('id', news.id);
  if (dbe) return `db err: ${dbe.message}`;
  const { error: de } = await sup.storage.from('news-images').remove([fn]);
  return `✅ fixed → ${newName} (${(buf.length / 1024).toFixed(0)}KB)${de ? `, old delete warn: ${de.message}` : ''}`;
}

(async () => {
  const { data: newsList } = await sup.from('news').select('id, title, image_url').order('published_at', { ascending: false }).limit(120);
  let fixed = 0;
  for (const n of newsList || []) {
    const result = await fixImage(n);
    if (result && result.startsWith('✅')) {
      fixed++;
      console.log(`✅ ${n.title?.substring(0, 50)} → ${result}`);
    } else if (result && result.startsWith('not image')) {
      console.log(`⚠️ ${n.title?.substring(0, 50)} → ${result}`);
    }
  }
  console.log(`\n📊 scanned=${(newsList || []).length} fixed=${fixed}`);
})();
