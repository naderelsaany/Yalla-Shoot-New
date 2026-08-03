/**
 * Self-monitoring (2026-08-03): delete remaining 16 non-football news
 * (politics/crime/tennis/basketball/celebrity/finance) — verified manually.
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

const TITLE_FRAGMENTS = [
  'استقبال رئيس الوزراء الإسباني',
  'السجن 20 عاما لمدير دار جنازات',
  'هدم المباني المتضررة من زلزالي فنزويلا',
  'أبطال بلاده لسلاح السيف',
  'احتجاجات الكهرباء تتصاعد في طرابلس',
  'أهلي حلب يستضيف الوحدة',
  'الدولار يستقر قرب أعلى مستوى',
  'فنان مصري يثير الجدل بين متابعيه',
  'حكومة ميرتس تؤجل أداء الوزراء',
  'القضاء المصري يحسم قضية فان دام',
  'بطولة مونتريال التحضيرية لأمريكا المفتوحة',
  'مؤسسة البترول الكويتية توقع صفقة تاريخية',
  'جيمس يستنسخ تجربة ميسي في NBA',
  'منظمة شنغهاي',
  'بطولة هامبورغ للتنس',
];

async function main() {
  const cutoff = new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString();
  const { data: news } = await supabase
    .from('news').select('id, title, image_url')
    .gte('published_at', cutoff)
    .order('published_at', { ascending: false })
    .limit(600);

  const toDelete = (news || []).filter((n) =>
    TITLE_FRAGMENTS.some((f) => n.title.includes(f))
  );
  console.log(`to delete: ${toDelete.length}`);
  toDelete.forEach((n) => console.log('  🗑️ ', n.title.substring(0, 80)));

  let del = 0, imgs = 0;
  for (const n of toDelete) {
    if (n.image_url && n.image_url.includes('/storage/v1/object/public/' + BUCKET + '/')) {
      const fn = decodeURIComponent(n.image_url.split(BUCKET + '/')[1] || '');
      if (fn) { const { error: se } = await supabase.storage.from(BUCKET).remove([fn]); if (!se) imgs++; }
    }
    const { error } = await supabase.from('news').delete().eq('id', n.id);
    if (!error) del++;
  }
  console.log(`✅ deleted: ${del}, images: ${imgs}`);
  const { count } = await supabase.from('news').select('id', { count: 'exact' });
  console.log('news now:', count);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
