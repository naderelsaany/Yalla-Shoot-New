const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim(); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data, error } = await sup.from('news').select('title, content').in('title', [
    'سر فشل مفاوضات الأهلي مع ديشامب قبل اختيار بوسيتش',
    'الزمالك لم يف بوعده.. بيان ناري من خوان بيزيرا',
    'الرمثا الأردني يكشف عن هوية مدربه الجديد',
    'ديوماندي يودع لايبزيغ برسالة مؤثرة: ريال مدريد حلم طفولتي!',
    'عرض إماراتي يشعل أزمة بيزيرا مع الزمالك المصري',
    'صلاح يقدم وعدا لجماهير طرابزون سبور'
  ]);
  console.log('error:', error ? error.message : 'none');
  (data || []).forEach(n => {
    console.log('=== ' + n.title.substring(0, 50));
    console.log((n.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 300));
    console.log();
  });
})();
