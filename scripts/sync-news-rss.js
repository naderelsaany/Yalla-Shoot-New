/**
 * RSS News Fetcher — يجلب آخر الأخبار من WinWin و SkyNews Arabia و RT Arabic
 * ويضيفها إلى Supabase — مع رفع الصور إلى Supabase Storage أولاً
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const PROJECT_DIR = process.env.CRON_WORKDIR || process.cwd();
try { process.chdir(PROJECT_DIR); } catch (e) { console.error('❌ Cannot chdir:', PROJECT_DIR); process.exit(1); }

const nodeModulesPath = path.join(PROJECT_DIR, 'node_modules');
if (fs.existsSync(nodeModulesPath)) { module.paths.unshift(nodeModulesPath); }

const { createClient } = require('@supabase/supabase-js');

// Node 18+ has built-in fetch, no need for node-fetch

// Load env
const env = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
if (!supabaseUrl || !supabaseKey) { console.error('❌ Missing Supabase credentials'); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

// Arabic football RSS sources
const RSS_FEEDS = [
  { name: 'WinWin', url: 'https://www.winwin.com/rss' },
  { name: 'SkyNews Sports', url: 'https://www.skynewsarabia.com/rss/sport.xml' },
  { name: 'RT Arabic', url: 'https://arabic.rt.com/rss/' },
];

const ARABIC_KEYWORDS = [
  'كرة قدم', 'مباراة', 'هدف', 'نادي', 'دوري', 'كأس', 'بطولة',
  'منتخب', 'لاعب', 'مدرب', 'حكم', 'ملعب', 'جمهور', 'صفقة',
  'انتقال', 'تعاقد', 'تجديد', 'عقد', 'احتراف', 'دوري أبطال',
  'الدوري المصري', 'الدوري السعودي', 'الدوري الإنجليزي',
  'الأهلي', 'الزمالك', 'الهلال', 'النصر', 'الاتحاد',
  'ريال مدريد', 'برشلونة', 'ليفربول', 'مانشستر', 'بايرن',
  'محمد صلاح', 'كأس العالم', 'مونديال', 'تصفيات', 'أمم أفريقيا',
  'كرة عالمية', 'رياضة', '进球', '足球',
];

// كلمات ممنوعة — تمنع المقالات السياسية/العسكرية التي تعبر الفلتر أعلاه
const EXCLUDED_KEYWORDS = [
  // عسكري وسياسي
  'الجيش الأمريكي', 'الجيش الإيراني', 'الجيش الروسي', 'القوات الروسية',
  'غارة جوية', 'ضربات جوية', 'قصف', 'مسيرات', 'صواريخ', 'هجمات',
  'مقتل', 'قتلى', 'قتيل', 'جرحى', 'إصابة', 'المصابين', 'قنابل',
  'أوكرانيا', 'روسيا', 'بوتين', 'زيلينسكي',
  'غزة', 'فلسطين', 'إسرائيل', 'نتنياهو', 'الضفة', 'لبنان', 'حزب الله',
  'الحوثي', 'الحوثيون', 'اليمن', 'صنعاء',
  'إيران', 'خامنئي', 'باسداران', 'طهران',
  'سوريا', 'دمشق', 'درعا', 'حمص', 'اللاذقية', 'حلب', 'إعزاز',
  // شخصيات غير رياضية
  'لافروف', 'بيسكوف', 'لوكاشينكو', 'زاخاروفا', 'بيسكوفا',
  'ترامب', 'رئيس أمريكا', 'البيت الأبيض', 'فانس',
  // 'إنفانتينو' intentionally removed — he IS football-related (FIFA president)
  // غير رياضي بحت
  'ميا خليفة', 'الكوكايين', 'مغن شهير',
  'جوديت بولغار', 'هنغاريا', 'الشطرنج',
  'محاولة اغتيال', 'مبنى فيدرالي',
  // سياسة دولية وقضاء
  'الاتحاد الأوروبي', 'الناتو', 'الأمم المتحدة',
  'دعوى قضائية', 'محكمة جنائية', 'الجنائية الدولية', 'المحكمة الجنائية',
  'المدعي العام', 'القضاء الدولي', 'عزل المدعي',
  'مبيعات الأسلحة', 'عقوبات',
  // أخبار غير رياضية
  'ألعاب القوى',  // athletics — not football
  // غير رياضي — مشاهد/اقتصاد/مجتمع
  'عارضة أزياء', 'خطيبها الملياردير', 'احتيال مزعوم',
  'رسوما على مغادري', 'مغادري البلاد', 'الجريدة الرسمية',
  'انفصال عارضة',
];

function isFootballRelated(title, content) {
  const text = (title + ' ' + (content || '')).toLowerCase();
  
  // أولاً: تحقق من الكلمات الممنوعة (non-sports)
  const hasExcluded = EXCLUDED_KEYWORDS.some(kw => text.includes(kw));
  if (hasExcluded) return false;
  
  // ثانياً: تحقق من الكلمات الرياضية
  return ARABIC_KEYWORDS.some(kw => text.includes(kw));
}

function generateSlug(title) {
  const safe = title.replace(/[^\w\u0600-\u06FF\s-]/g, '').trim().replace(/\s+/g, '-').substring(0, 80);
  // Use title hash + short timestamp instead of Date.now() to allow dedup
  const hash = crypto.createHash('md5').update(title).digest('hex').substring(0, 8);
  return `${safe}-${hash}`;
}

async function parseRSS(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) { console.error(`  ⚠️ ${url}: HTTP ${res.status}`); return []; }
    const xml = await res.text();
    
    // Parse <item> elements
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];
      
      const title = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim();
      const link = itemXml.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim();
      const desc = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim();
      const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim();
      
      // Try multiple image patterns
      let image = itemXml.match(/<media:content[^>]*url="([^"]+)"/i)?.[1];
      if (!image) image = itemXml.match(/<enclosure[^>]*url="([^"]+)"/i)?.[1];
      if (!image) image = itemXml.match(/<media:thumbnail[^>]*url="([^"]+)"/i)?.[1];
      
      if (title && link) {
        items.push({ title, link, description: desc || '', image, pubDate });
      }
    }
    
    return items;
  } catch (e) {
    console.error(`  ⚠️ ${url}: ${e.message}`);
    return [];
  }
}

/**
 * 🗜️ ضغط الصورة باستخدام sharp — تحويل للـ JPEG بجودة 80 وضبط العرض
 * يرجع buffer مضغوط، أو البuffer الأصلي إذا فشل الضغط أو كان أكبر
 */
async function compressImage(buffer, contentType) {
  try {
    const sharp = require('sharp');
    const ext = (contentType.split('/')[1] || 'jpeg').replace('jpeg', 'jpg');
    let img = sharp(buffer, { failOn: 'none' }).rotate();
    const meta = await img.metadata();
    // لا تضغط الصور الصغيرة جداً
    if (!meta.width) return buffer;
    // ضبط العرض الأقصى 1280px
    if (meta.width > 1280) {
      img = img.resize({ width: 1280, withoutEnlargement: true });
    }
    let out;
    if (ext === 'png') out = await img.png({ compressionLevel: 9 }).toBuffer();
    else if (ext === 'webp') out = await img.webp({ quality: 80 }).toBuffer();
    else out = await img.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    return out.length < buffer.length ? out : buffer;
  } catch (e) {
    console.error(`  ⚠️ فشل الضغط: ${e.message}`);
    return buffer;
  }
}

/**
 * تحميل الصورة من الرابط الخارجي ورفعها إلى Supabase Storage
 * ثم إرجاع رابط Supabase العام — أو null إذا فشلت العملية
 */
async function downloadAndUploadImage(imageUrl, title) {
  if (!imageUrl) return null;
  try {
    console.log(`  📥 تحميل صورة: ${imageUrl.substring(0, 60)}...`);
    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'ar,en;q=0.9',
        'Referer': 'https://www.winwin.com/',
      }
    });
    if (!response.ok) {
      console.error(`  ⚠️ فشل تحميل الصورة (HTTP ${response.status})`);
      return null;
    }
    let buffer = Buffer.from(await response.arrayBuffer());
    
    // Skip if too large (>4MB)
    if (buffer.length > 4 * 1024 * 1024) {
      console.error(`  ⚠️ الصورة كبيرة جداً: ${(buffer.length / 1024 / 1024).toFixed(1)}MB`);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // 🗜️ Compress images > 300KB with sharp to keep storage lean (SEO + speed)
    if (buffer.length > 300 * 1024) {
      const compressed = await compressImage(buffer, contentType);
      if (compressed && compressed.length < buffer.length) {
        console.log(`  🗜️ مضغوطة: ${(buffer.length / 1024 / 1024).toFixed(2)}MB → ${(compressed.length / 1024 / 1024).toFixed(2)}MB`);
        buffer = compressed;
      }
    }
    
    const ext = contentType.split('/')[1] || 'jpg';
    
    // Generate safe filename
    const hash = crypto.createHash('md5').update(title + Date.now()).digest('hex').substring(0, 8);
    const fileName = `news-${hash}-${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext === 'svg' ? 'svg+xml' : ext}`;
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('news-images')
      .upload(fileName, buffer, {
        contentType: `image/${ext === 'svg' ? 'svg+xml' : ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : ext}`,
        upsert: true,
      });
    
    if (uploadError) {
      console.error(`  ⚠️ فشل رفع الصورة: ${uploadError.message}`);
      return null;
    }
    
    // Verify the upload by checking size
    const { data: uploadedInfo } = await supabase.storage.from('news-images').list('', { search: fileName });
    if (uploadedInfo && uploadedInfo.length > 0) {
      console.log(`  ✅ تم رفع الصورة (${(uploadedInfo[0].metadata?.size || buffer.length) / 1024 / 1024 | 0}MB): ${fileName}`);
    }
    
    const { data: urlData } = supabase.storage.from('news-images').getPublicUrl(fileName);
    console.log(`  ✅ تم رفع الصورة إلى Supabase: ${fileName}`);
    return urlData.publicUrl;
  } catch (e) {
    console.error(`  ⚠️ خطأ في معالجة الصورة: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log('🔄 جلب الأخبار من RSS...\n');
  let totalAdded = 0;
  let totalSkipped = 0;
  let totalImagesUploaded = 0;
  
  // Get existing slugs AND titles to avoid duplicates
  const { data: existingNews } = await supabase.from('news').select('slug, title').limit(5000);
  const existingSlugs = new Set(existingNews?.map(n => n.slug) || []);
  const existingTitles = new Set(existingNews?.map(n => n.title?.trim()?.toLowerCase()) || []);
  console.log(`📊 الأخبار الموجودة: ${existingSlugs.size}\n`);
  
  for (const feed of RSS_FEEDS) {
    console.log(`── ${feed.name} ──`);
    const items = await parseRSS(feed.url);
    console.log(`  📡 ${items.length} خبر مستلم`);
    
    let feedAdded = 0;
    let feedSkipped = 0;
    let feedNotFootball = 0;
    let feedDuplicates = 0;
    
    for (const item of items) {
      // Check if football related
      if (!isFootballRelated(item.title, item.description)) {
        feedSkipped++;
        feedNotFootball++;
        continue;
      }
      
      // Generate unique slug
      const slug = generateSlug(item.title);
      if (existingSlugs.has(slug)) { feedSkipped++; feedDuplicates++; continue; }
      
      // Also check by title to prevent cross-feed duplicates
      const normalizedTitle = item.title?.trim()?.toLowerCase();
      if (normalizedTitle && existingTitles.has(normalizedTitle)) { feedSkipped++; feedDuplicates++; continue; }
      
      // Clean title (remove CDATA + decode HTML entities)
      const cleanTitle = item.title
        .replace(/<!\[CDATA\[|\]\]>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#\d+;/g, ' ')
        .trim();
      
      // Clean description - strip HTML
      const cleanDesc = (item.description || '')
        .replace(/<!\[CDATA\[|\]\]>/g, '')
        .replace(/<[^>]*>/g, '')
        .replace(/&[^;]+;/g, ' ')
        .trim()
        .substring(0, 500);
      
      // Upload image to Supabase Storage first
      let storageUrl = null;
      if (item.image) {
        storageUrl = await downloadAndUploadImage(item.image, cleanTitle);
        if (storageUrl) totalImagesUploaded++;
      }
      
      // Parse date
      let pubDate = new Date();
      if (item.pubDate) {
        const parsed = new Date(item.pubDate);
        if (!isNaN(parsed.getTime())) pubDate = parsed;
      }
      
      const newsItem = {
        title: cleanTitle.substring(0, 200),
        slug,
        content: cleanDesc,
        image_url: storageUrl || null,  // ONLY Supabase Storage URLs - no external URLs
        published_at: pubDate.toISOString(),
        summary: cleanDesc.substring(0, 160),
      };
      
      const { error } = await supabase.from('news').insert([newsItem]);
      if (error) {
        console.error(`  ⚠️ فشل إضافة "${cleanTitle.substring(0, 40)}": ${error.message}`);
        continue;
      }
      
      existingSlugs.add(slug);
      if (normalizedTitle) existingTitles.add(normalizedTitle);
      feedAdded++;
      totalAdded++;
      console.log(`  ✅ ${cleanTitle.substring(0, 60)}`);
    }
    
    if (feedAdded === 0 && feedSkipped > 0) {
      if (feedNotFootball > 0 && feedDuplicates === 0) {
        console.log(`  ⏭️ ${feedNotFootball} خبر غير رياضي`);
      } else if (feedDuplicates > 0 && feedNotFootball === 0) {
        console.log(`  🔄 ${feedDuplicates} خبر موجود بالفعل`);
      } else {
        console.log(`  ⏭️ ${feedNotFootball} غير رياضي, 🔄 ${feedDuplicates} مكرر`);
      }
    }
    console.log(`  📊 +${feedAdded} جديد, ${feedSkipped} متخطى\n`);
  }
  
  console.log(`📊 ===== تقرير الأخبار =====`);
  console.log(`🆕 أخبار جديدة مضافة: ${totalAdded}`);
  if (totalImagesUploaded > 0) {
    console.log(`📸 صور مرفوعة لـ Supabase Storage: ${totalImagesUploaded}`);
  }
  
  console.log(`\n✅ تمت المزامنة`);
}

main().catch(err => { console.error('❌ خطأ:', err.message); process.exit(1); });
