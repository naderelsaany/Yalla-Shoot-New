// Scan recent news images for corruption (magic bytes check)
const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const i = l.indexOf('='); if (i > 0) { process.env[l.slice(0, i).trim()] = l.slice(i + 1).trim(); } });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const MAGIC = {
  'ffd8ff': 'JPEG',
  '89504e47': 'PNG',
  '474946': 'GIF',
  '3c737667': 'SVG',
  '52494646': 'WEBP(RIFF)',
};

(async () => {
  const { data: news } = await sup.from('news').select('id, title, image_url').gte('published_at', '2026-07-28').order('published_at', { ascending: false }).limit(300);
  console.log('news to check:', news.length);
  const corrupt = [];
  for (const n of news) {
    if (!n.image_url) { corrupt.push({ id: n.id, title: n.title.substring(0, 50), reason: 'NO_IMAGE' }); continue; }
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch(n.image_url, { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) { corrupt.push({ id: n.id, title: n.title.substring(0, 50), reason: 'HTTP_' + res.status }); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      const head = buf.subarray(0, 8).toString('hex');
      let ok = false;
      for (const [magic, name] of Object.entries(MAGIC)) { if (head.startsWith(magic)) { ok = true; break; } }
      if (!ok) corrupt.push({ id: n.id, title: n.title.substring(0, 50), reason: 'BAD_MAGIC:' + head.substring(0, 12), size: buf.length });
    } catch (e) {
      corrupt.push({ id: n.id, title: n.title.substring(0, 50), reason: 'ERR:' + e.message.substring(0, 40) });
    }
  }
  console.log('\n=== CORRUPT/MISSING (' + corrupt.length + ') ===');
  corrupt.forEach(c => console.log(JSON.stringify(c)));
})();
