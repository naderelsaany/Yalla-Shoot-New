/**
 * Self-monitoring (2026-08-03): delete non-sports news leaked from RT Arabic feed.
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const PROJECT_DIR = process.cwd();
const env = fs.readFileSync(path.join(PROJECT_DIR, '.env.local'), 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET = 'news-images';

// Non-sports distinctive patterns — any match → delete (none are football terms)
const NON_SPORTS_PATTERNS = [
  /كوارث/, /جيولوجي/, /مليون سنة/,
  /الحشد الشعبي/, /الصادقون/, /نيابية/,
  /الجمهوريون/, /المطارات الأمريكية/,
  /نقص الغذاء/, /موجة الحر/,
  /الين الياباني/,
  /الشلل/, /إشارات الدماغ/,
  /طلاق/, /مسرح/,
  /النصب/, /العدام/,
  /المستشار الألماني/, /انتخابات/,
  /الخطاب القومي/, /الخطاب الإسلامي/,
  /أوبك/, /إنتاج النفط/,
  /قضية إرهاب/, /المؤبد/,
  /التنس/, /السلة/,
];

async function main() {
  const cutoff = new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString();
  const { data: news } = await supabase
    .from('news')
    .select('id, title, image_url')
    .gte('published_at', cutoff)
    .limit(500);

  const toDelete = (news || []).filter((n) =>
    NON_SPORTS_PATTERNS.some((p) => p.test(n.title))
  );
  console.log(`Non-sports news to delete: ${toDelete.length}`);
  toDelete.forEach((n) => console.log('  🗑️ ', n.title.substring(0, 80)));

  let deleted = 0, imgs = 0;
  for (const n of toDelete) {
    if (n.image_url && n.image_url.includes('/storage/v1/object/public/' + BUCKET + '/')) {
      const fn = decodeURIComponent(n.image_url.split(BUCKET + '/')[1] || '');
      if (fn) { const { error: se } = await supabase.storage.from(BUCKET).remove([fn]); if (!se) imgs++; }
    }
    const { error } = await supabase.from('news').delete().eq('id', n.id);
    if (!error) deleted++;
  }
  console.log(`✅ deleted: ${deleted}, storage images removed: ${imgs}`);

  const { count } = await supabase.from('news').select('id', { count: 'exact' });
  console.log(`news now: ${count}`);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });