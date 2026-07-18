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
  'محمد صلاح', 'كأس العالم', 'تصفيات', 'أمم أفريقيا',
  'كرة عالمية', 'رياضة', '进球', '足球',
];

function isFootballRelated(title, content) {
  const text = (title + ' ' + (content || '')).toLowerCase();
  return ARABIC_KEYWORDS.some(kw => text.includes(kw));
}

function generateSlug(title) {
  const safe = title.replace(/[^\w\u0600-\u06FF\s-]/g, '').trim().replace(/\s+/g, '-').substring(0, 80);
  return safe + '-' + Date.now().toString(36);
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
 * تحميل الصورة من الرابط الخارجي ورفعها إلى Supabase Storage
 * ثم إرجاع رابط Supabase العام — أو null إذا فشلت العملية
 */
async function downloadAndUploadImage(imageUrl, title) {
  if (!imageUrl) return null;
  try {
    console.log(`  📥 تحميل صورة: ${imageUrl.substring(0, 60)}...`);
    const response = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) {
      console.error(`  ⚠️ فشل تحميل الصورة (HTTP ${response.status})`);
      return null;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Skip if too large (>4MB)
    if (buffer.length > 4 * 1024 * 1024) {
      console.error(`  ⚠️ الصورة كبيرة جداً: ${(buffer.length / 1024 / 1024).toFixed(1)}MB`);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
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
  
  // Get existing slugs to avoid duplicates
  const { data: existingNews } = await supabase.from('news').select('slug').limit(500);
  const existingSlugs = new Set(existingNews?.map(n => n.slug) || []);
  console.log(`📊 الأخبار الموجودة: ${existingSlugs.size}\n`);
  
  for (const feed of RSS_FEEDS) {
    console.log(`── ${feed.name} ──`);
    const items = await parseRSS(feed.url);
    console.log(`  📡 ${items.length} خبر مستلم`);
    
    let feedAdded = 0;
    let feedSkipped = 0;
    
    for (const item of items) {
      // Check if football related
      if (!isFootballRelated(item.title, item.description)) {
        feedSkipped++;
        continue;
      }
      
      // Generate unique slug
      const slug = generateSlug(item.title);
      if (existingSlugs.has(slug)) { feedSkipped++; continue; }
      
      // Clean title (remove CDATA)
      const cleanTitle = item.title.replace(/<!\[CDATA\[|\]\]>/g, '').trim();
      
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
        image_url: storageUrl || item.image || null,  // Use Storage URL if available, else external as fallback
        published_at: pubDate.toISOString(),
        summary: cleanDesc.substring(0, 160),
      };
      
      const { error } = await supabase.from('news').insert([newsItem]);
      if (error) {
        console.error(`  ⚠️ فشل إضافة "${cleanTitle.substring(0, 40)}": ${error.message}`);
        continue;
      }
      
      existingSlugs.add(slug);
      feedAdded++;
      totalAdded++;
      console.log(`  ✅ ${cleanTitle.substring(0, 60)}`);
    }
    
    if (feedAdded === 0 && feedSkipped > 0) {
      console.log(`  ⏭️ ${feedSkipped} خبر غير رياضي`);
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
