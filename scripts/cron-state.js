const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim(); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data, error } = await sup.from('news').select('id, title, image_url').in('title', [
    'جريمة بشعة تهز كرة القدم.. نهاية مأسوية للاعب أمام منزله!',
    'للمرة الأولى.. مصر تتأهل إلى نصف نهائي مونديال ناشئات اليد',
    'اتفاقية التجارة الحرة بين الأوراسي والإمارات تبدأ الشهر المقبل',
    'هل يفوز الطبيب ذو الأصول المصرية بمقعد في مجلس الشيوخ؟',
    'تركيا تستهدف تشغيل جميع مفاعلات محطة "أكويو" النووية بحلول عام 2030',
    'رئيس بلدية سبتة يؤكد لملك إسبانيا ضرورة طرد جميع المهاجرين المغاربة غير الشرعيين',
    'الإمارات.. تأجيل نظر قضية "العتاد العسكري للسودان" بعد تقديم تسجيل جديد'
  ]);
  console.log('error:', error ? error.message : 'none');
  console.log('rows:', data ? data.length : 0);
  (data || []).forEach(n => console.log(' -', n.title.substring(0, 50)));
})();
