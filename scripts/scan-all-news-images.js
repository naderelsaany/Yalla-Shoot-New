/**
 * Scan ALL news images for corruption via magic bytes (JPEG/PNG/GIF/WebP)
 * Report only, no fixes — cron 2026-08-06
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

function isValidImage(buf) {
  if (buf.length > 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'jpeg';
  if (buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'png';
  if (buf.length > 3 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'gif';
  if (buf.length > 4 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return 'webp/riff';
  return null;
}

(async () => {
  // fetch all news image_urls (paginated)
  let all = [];
  let from = 0;
  while (true) {
    const { data } = await sup.from('news').select('id, title, image_url').range(from, from + 499);
    if (!data || data.length === 0) break;
    all = all.concat(data);
    from += 500;
    if (data.length < 500) break;
  }
  console.log('total news:', all.length);
  let corrupt = [];
  let noImage = 0;
  let checked = 0;
  for (const n of all) {
    if (!n.image_url) { noImage++; continue; }
    const fn = n.image_url.split('/').pop();
    if (!fn || !fn.startsWith('news-')) continue;
    try {
      const { data, error } = await sup.storage.from('news-images').download(fn);
      if (error) { corrupt.push({ title: n.title, reason: 'dl err ' + error.message, file: fn }); continue; }
      const buf = Buffer.from(await data.arrayBuffer());
      checked++;
      if (!isValidImage(buf)) {
        corrupt.push({ title: n.title, reason: 'bad magic ' + buf.subarray(0, 4).toString('hex'), file: fn, size: buf.length });
      }
    } catch (e) {
      corrupt.push({ title: n.title, reason: 'exc ' + e.message.substring(0, 30), file: fn });
    }
  }
  console.log('checked:', checked, 'noImage:', noImage);
  console.log('CORRUPT:', corrupt.length);
  corrupt.forEach(c => console.log('-', c.reason, '|', (c.size || ''), '|', (c.title || '').substring(0, 55), '|', c.file));
})();
