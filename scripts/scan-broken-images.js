// فحص شامل: يفحص ترويسة كل صور أخبار آخر 48 ساعة ويكشف التالفة
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

async function main() {
  const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const { data: news } = await supabase.from('news').select('id, title, image_url, published_at').gte('published_at', since).limit(500);
  console.log(`📰 أخبار آخر 48 ساعة: ${news.length}`);
  const toCheck = news.filter(n => n.image_url && n.image_url.includes('supabase.co/storage'));
  console.log(`🔍 للفحص: ${toCheck.length}`);
  let broken = [];
  let checked = 0;
  for (const n of toCheck) {
    checked++;
    try {
      const res = await fetch(n.image_url, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) { broken.push({ title: n.title, reason: `HTTP ${res.status}` }); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (!looksLikeImage(buf)) {
        broken.push({ title: n.title, reason: `bad magic: ${buf.subarray(0, 8).toString('hex')}` });
      }
    } catch (e) {
      broken.push({ title: n.title, reason: `ERR ${e.message}` });
    }
    if (checked % 50 === 0) console.log(`  ...فحص ${checked}/${toCheck.length}`);
  }
  console.log(`\n❌ تالفة: ${broken.length}`);
  broken.forEach(b => console.log('  -', b.reason, '|', b.title.substring(0, 70)));
}
main();
