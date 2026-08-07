/**
 * REPAIR phase 2:
 * A) Delete duplicates/off-topic broken rows (Uganda crime dup + handball)
 * B) For remaining 10 broken sports articles: fetch relevant image (player photo or club logo)
 *    from Wikipedia API, upload to Supabase Storage under the SAME filename the row references (upsert),
 *    so image_url works with zero DB changes.
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim(); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BASE = `https://${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '')}/storage/v1/object/public/news-images/`;

// title-substring -> Wikipedia page to pull image from
const FIX_MAP = [
  { match: 'باريس سان جيرمان يحدد موعد عودة أشرف حكيمي', page: 'Achraf Hakimi' },
  { match: 'ديوماندي يودع لايبزيغ', page: 'Yan Diomandé' },
  { match: 'الزمالك لم يف بوعده', page: 'Zamalek SC' },
  { match: 'سر فشل مفاوضات الأهلي مع ديشامب', page: 'Al-Ahli Saudi FC' },
  { match: 'تحرك عاجل من زيزو', page: 'Ahmed Sayed' },
  { match: 'الرمثا الأردني', page: 'Al-Ramtha SC' },
  { match: 'عودة الأسطورة.. دييغو فورلان', page: 'Diego Forlán' },
  { match: 'ماتياس يايسله يترك الدوري السعودي', page: 'Matthias Jaissle' },
  { match: 'صلاح يقدم وعدا لجماهير طرابزون', page: 'Mohamed Salah' },
  { match: 'عرض إماراتي يشعل أزمة بيزيرا', page: 'Zamalek SC' },
];

const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36' };

async function wikiImage(page) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(page)}&prop=pageimages&format=json&pithumbsize=600&redirects=1`;
  try {
    const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(15000) });
    const j = await r.json();
    const pages = j.query && j.query.pages ? j.query.pages : {};
    for (const k of Object.keys(pages)) {
      const p = pages[k];
      if (p.thumbnail && p.thumbnail.source) return { src: p.thumbnail.source, title: p.title };
      if (p.pageimage) return { src: null, title: p.title, pageimage: p.pageimage };
    }
  } catch (e) {}
  return null;
}

async function uploadToFilename(imgUrl, filename) {
  try {
    const img = await fetch(imgUrl, { headers: UA, signal: AbortSignal.timeout(20000) });
    if (!img.ok) return { ok: false, why: 'img http ' + img.status };
    const buf = Buffer.from(await img.arrayBuffer());
    if (buf.length < 1000) return { ok: false, why: 'too small ' + buf.length };
    const { error } = await sup.storage.from('news-images').upload(filename, buf, { contentType: img.headers.get('content-type') || 'image/jpeg', upsert: true });
    if (error) return { ok: false, why: error.message };
    return { ok: true, bytes: buf.length };
  } catch (e) { return { ok: false, why: e.message }; }
}

(async () => {
  // A) delete duplicates/off-topic
  const delTitles = ['جريمة بشعة تهز كرة القدم', 'للمرة الأولى.. مصر تتأهل إلى نصف نهائي مونديال ناشئات اليد'];
  for (const t of delTitles) {
    const { data } = await sup.from('news').select('id, title, image_url').ilike('title', `%${t}%`);
    if (data && data.length) {
      for (const n of data) {
        const file = (n.image_url || '').split('/news-images/')[1];
        if (file) await sup.storage.from('news-images').remove([file]).catch(() => {});
        const { error } = await sup.from('news').delete().eq('id', n.id);
        console.log(error ? `DEL FAIL ${t}: ${error.message}` : `✅ deleted (dup/off-topic): ${n.title.substring(0, 50)}`);
      }
    }
  }

  // B) fix images for remaining broken sports rows
  const still = JSON.parse(fs.readFileSync('scripts/_still-broken.json', 'utf-8'));
  for (const s of still) {
    const fx = FIX_MAP.find(f => s.title.includes(f.match));
    if (!fx) continue;
    const file = s.file;
    if (!file) continue;
    const info = await wikiImage(fx.page);
    if (!info || !info.src) { console.log(`❌ no wiki image for ${fx.page} (${s.title.substring(0, 40)})`); continue; }
    const up = await uploadToFilename(info.src, file);
    console.log(`${up.ok ? '✅' : '❌'} ${s.title.substring(0, 45)} <- ${info.title} ${up.ok ? '(' + up.bytes + 'B)' : up.why}`);
  }
})();
