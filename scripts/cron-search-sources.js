const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim(); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 12 sports articles whose images are broken and NOT in RSS anymore
const TARGETS = [
  'باريس سان جيرمان يحدد موعد عودة أشرف حكيمي',
  'للمرة الأولى.. مصر تتأهل إلى نصف نهائي مونديال ناشئات اليد',
  'ديوماندي يودع لايبزيغ برسالة مؤثرة',
  'الزمالك لم يف بوعده.. بيان ناري من خوان بيزيرا',
  'سر فشل مفاوضات الأهلي مع ديشامب قبل اختيار بوسيتش',
  'تحرك عاجل من زيزو بسبب مستحقاته لدى الزمالك',
  'جريمة بشعة تهز كرة القدم',
  'الرمثا الأردني يكشف عن هوية مدربه الجديد',
  'عودة الأسطورة.. دييغو فورلان يتولى تدريب أوروغواي',
  'ماتياس يايسله يترك الدوري السعودي',
  'صلاح يقدم وعدا لجماهير طرابزون سبور',
  'عرض إماراتي يشعل أزمة بيزيرا مع الزمالك',
];

async function searchBing(q) {
  const url = 'https://www.bing.com/search?q=' + encodeURIComponent(q) + '&setlang=ar&cc=eg';
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36', 'Accept-Language': 'ar,en;q=0.8' }, signal: AbortSignal.timeout(15000) });
    const html = await r.text();
    // extract first result links (bing organic results)
    const links = [];
    const re = /<h2><a href="([^"]+)"/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const u = m[1];
      if (u.includes('bing.com') || u.includes('microsoft')) continue;
      links.push(u);
    }
    return links.slice(0, 3);
  } catch (e) { return []; }
}

async function getOgImage(pageUrl) {
  try {
    const r = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36' }, signal: AbortSignal.timeout(15000), redirect: 'follow' });
    if (!r.ok) return null;
    const html = await r.text();
    const og = html.match(/property="og:image"\s+content="([^"]+)"/) || html.match(/content="([^"]+)"\s+property="og:image"/);
    return og ? og[1] : null;
  } catch (e) { return null; }
}

(async () => {
  for (const t of TARGETS) {
    const links = await searchBing(t);
    console.log('==', t.substring(0, 55));
    if (!links.length) { console.log('   no results'); continue; }
    for (const l of links.slice(0, 2)) {
      const og = await getOgImage(l);
      console.log('   ', l.substring(0, 85), '| og:', og ? og.substring(0, 90) : 'NONE');
      if (og) break;
    }
  }
})();
