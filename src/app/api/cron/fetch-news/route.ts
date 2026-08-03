import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import Parser from 'rss-parser';
import crypto from 'crypto';

const RSS_FEEDS = [
  // Sky News Arabia Sports
  { url: 'https://www.skynewsarabia.com/rss/sport.xml', lang: 'ar' },
  // WinWin Football News
  { url: 'https://www.winwin.com/rss', lang: 'ar' },
];

// كلمات رياضية — يجب وجود كلمة واحدة على الأقل لاعتبار الخبر رياضياً
const ARABIC_KEYWORDS = [
  'كرة قدم', 'مباراة', 'هدف', 'نادي', 'دوري', 'كأس', 'بطولة',
  'منتخب', 'لاعب', 'مدرب', 'ملعب',
  'انتقال', 'تعاقد', 'تجديد', 'احتراف',
  'الدوري المصري', 'الدوري السعودي', 'الدوري الإنجليزي',
  'الأهلي', 'الزمالك', 'الهلال', 'النصر', 'الاتحاد',
  'ريال مدريد', 'برشلونة', 'ليفربول', 'مانشستر', 'بايرن',
  'محمد صلاح', 'كأس العالم', 'تصفيات', 'أمم أفريقيا',
  'كرة عالمية', 'فيفا', 'إنفانتينو',
];

// كلمات ممنوعة — تمنع المقالات السياسية/العسكرية
const EXCLUDED_KEYWORDS = [
  'الجيش', 'القوات', 'غارة', 'قصف', 'مسيرة', 'صواريخ',
  'مقتل', 'قتلى', 'جرحى',
  'أوكرانيا', 'روسيا', 'بوتين',
  'روسية', 'الروسية', 'أوكرانية', 'الأوكرانية',
  'الدفاع الروسية', 'وزارة الدفاع', 'سوبيانين', 'البحر الأسود',
  'دمياط', 'منشأة تخزين', 'ناقلة للشحنات', 'مسيّرة',
  'غزة', 'فلسطين', 'إسرائيل', 'نتنياهو',
  'إيران', 'خامنئي',
  'لافروف', 'بيسكوف', 'لوكاشينكو',
  'ترامب', 'البيت الأبيض', 'فانس',
  'ميا خليفة', 'الكوكايين',
  'الاتحاد الأوروبي', 'الناتو',
  'دعوى قضائية', 'محكمة',
  'كرة السلة', 'دوري السلة', 'التنس', 'كرة المضرب',
  'كوارث', 'الحشد الشعبي', 'الجمهوريون', 'نقص الغذاء',
  'موجة الحر', 'الإعدام', 'المؤبد', 'إرهاب', 'أوبك', 'إنتاج النفط',
];

function isFootballRelated(title: string): boolean {
  const text = title.toLowerCase();
  // أولاً: تحقق من الكلمات الممنوعة
  if (EXCLUDED_KEYWORDS.some(kw => text.includes(kw))) return false;
  // ثانياً: تحقق من الكلمات الرياضية
  return ARABIC_KEYWORDS.some(kw => text.includes(kw));
}

function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ');
}

function stripHtml(s: string): string {
  return decodeEntities(s.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** 🗜️ Compress image with sharp — JPEG q80, max width 1280px. Returns smaller buffer or original. */
async function compressImage(buffer: Buffer, contentType: string): Promise<Buffer | null> {
  try {
    const sharp = (await import('sharp')).default;
    const ext = (contentType.split('/')[1] || 'jpeg').replace('jpeg', 'jpg');
    let img = sharp(buffer, { failOn: 'none' }).rotate();
    const meta = await img.metadata();
    if (!meta.width) return buffer;
    if (meta.width > 1280) {
      img = img.resize({ width: 1280, withoutEnlargement: true });
    }
    let out: Buffer;
    if (ext === 'png') out = await img.png({ compressionLevel: 9 }).toBuffer();
    else if (ext === 'webp') out = await img.webp({ quality: 80 }).toBuffer();
    else out = await img.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    return out.length < buffer.length ? out : buffer;
  } catch (e) {
    console.error(`Compression failed: ${e}`);
    return buffer;
  }
}

async function downloadAndUploadImage(url: string, title: string): Promise<string | null> {
  try {
    // Download image
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) {
      console.error(`Image download failed: ${response.status} for ${url.substring(0, 80)}`);
      return null;
    }
    let buffer: Buffer = Buffer.from(await response.arrayBuffer());
    
    // Skip if too large (>4MB)
    if (buffer.length > 4 * 1024 * 1024) {
      console.error(`Image too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB > 4MB`);
      return null;
    }
    
    // 🛡️ فحص الترويسة (magic bytes) — يرفض الملفات التالفة/غير الصورية
    // (2026-08-01: ملفات تبدأ بـ EF BF BD (U+FFFD) رُفعت وظهرت مكسورة في الموقع)
    const isJpeg = buffer.length > 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    const isPng  = buffer.length > 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    const isGif  = buffer.length > 3 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
    const isWebp = buffer.length > 12 && buffer.toString('latin1', 0, 4) === 'RIFF' && buffer.toString('latin1', 8, 12) === 'WEBP';
    if (!isJpeg && !isPng && !isGif && !isWebp) {
      console.error(`Invalid image magic bytes (${buffer.subarray(0, 8).toString('hex')}) — rejected`);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // 🗜️ Compress images > 300KB with sharp (keep storage lean + faster pages)
    if (buffer.length > 300 * 1024) {
      const compressed = await compressImage(buffer, contentType);
      if (compressed && compressed.length < buffer.length) {
        console.log(`Image compressed: ${(buffer.length / 1048576).toFixed(2)}MB → ${(compressed.length / 1048576).toFixed(2)}MB`);
        buffer = compressed;
      }
    }
    
    const extRaw = contentType.split('/')[1] || 'jpg';
    const ext = extRaw === 'jpeg' ? 'jpg' : extRaw === 'svg' ? 'svg+xml' : extRaw;
    
    // Generate safe filename
    const hash = crypto.createHash('md5').update(title + Date.now()).digest('hex').substring(0, 8);
    const fileName = `news-${hash}-${Date.now()}.${ext}`;
    
    // Upload to Supabase Storage
    const supabase = getServiceSupabase();
    const { error: uploadError } = await supabase.storage
      .from('news-images')
      .upload(fileName, buffer, {
        contentType: `image/${ext === 'svg' ? 'svg+xml' : ext === 'jpg' ? 'jpeg' : ext}`,
        upsert: true,
      });
    
    if (uploadError) {
      console.error(`Storage upload error: ${uploadError.message}`);
      return null;
    }
    
    const { data: urlData } = supabase.storage.from('news-images').getPublicUrl(fileName);
    return urlData.publicUrl;
  } catch (e) {
    console.error(`Image processing error: ${e}`);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    // Accept either CRON_SECRET Bearer token OR Vercel Cron internal header
    const authHeader = request.headers.get('authorization');
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    const isValidAuth = authHeader === `Bearer ${process.env.CRON_SECRET}` || isVercelCron;
    if (!isValidAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parser = new Parser();
    const supabase = getServiceSupabase();
    let totalInserted = 0;
    let totalProcessed = 0;

    for (const feedConfig of RSS_FEEDS) {
      try {
        const feed = await parser.parseURL(feedConfig.url);
        const latestItems = feed.items.slice(0, 10);

        for (const item of latestItems) {
          if (!item.title) continue;
          totalProcessed++;

          // تنظيف العنوان: فك ترميز HTML entities
          const cleanTitle = decodeEntities(item.title).trim();

          // 🔍 فلترة: تحقق أن الخبر رياضي وليس سياسي/عسكري
          if (!isFootballRelated(cleanTitle)) {
            console.log(`Skipped (non-sports): ${cleanTitle.substring(0, 60)}`);
            continue;
          }

          // Extract image from multiple possible sources
          let imageUrl = null;
          if (item.enclosure?.url) {
            imageUrl = item.enclosure.url;
          }
          // WinWin uses media:content as well (rss-parser maps this to mediaContent or similar)
          if (!imageUrl && (item as any).mediaContent?.url) {
            imageUrl = (item as any).mediaContent.url;
          }
          // Fallback: try to extract from content HTML
          if (!imageUrl && item.content) {
            const imgMatch = item.content.match(/<img[^>]+src=["']([^"']+)["']/);
            if (imgMatch) imageUrl = imgMatch[1];
          }

          // Check for duplicate by title
          const { data: existingNews } = await supabase
            .from('news')
            .select('id')
            .eq('title', cleanTitle)
            .maybeSingle();

          if (!existingNews) {
            // Upload image to Supabase Storage before saving
            let storageUrl = null;
            if (imageUrl) {
              storageUrl = await downloadAndUploadImage(imageUrl, cleanTitle);
              // If upload fails, DON'T store external URL — only Supabase URLs are reliable
            }
            
            // 🛡️ القاعدة الإلزامية: كل خبر لازم يكون له صورة من Supabase Storage
            // إذا فشل التحميل/الرفع → تخطَّ الخبر كاملاً (لا ندرج بدون صورة)
            if (!storageUrl) {
              console.log(`Skipped (image failed): ${cleanTitle.substring(0, 60)}`);
              continue;
            }

            // Generate slug from title
            const titleClean = cleanTitle.replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, '');
            const slug = titleClean + '-' + Date.now();

            const rawContent = (item.contentSnippet || item.content || '');
            const excerpt = rawContent.length > 300 ? rawContent.substring(0, 300) + '...' : rawContent;
            const originalLink = item.link 
              ? `<br><br><a href="${item.link}" target="_blank" rel="nofollow noopener" style="color: var(--color-accent); font-weight: bold;">اقرأ الخبر كاملاً من المصدر الرسمي</a>` 
              : '';
            const content = excerpt + originalLink;
            // ملخص نصي نظيف (بدون HTML) للعرض في البطاقات
            const summary = stripHtml(excerpt).substring(0, 160);

            const { error } = await supabase.from('news').insert({
              title: cleanTitle,
              slug: slug,
              content: content,
              summary: summary,
              image_url: storageUrl,
              published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            });

            if (error) {
              console.error(`Insert error (${feedConfig.url}):`, error);
            } else {
              totalInserted++;
            }
          }
        }
      } catch (feedError) {
        console.error(`Failed to parse feed ${feedConfig.url}:`, feedError);
        // Continue to next feed
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${totalProcessed} items across ${RSS_FEEDS.length} feeds. Inserted ${totalInserted} new news.`,
    });
  } catch (error) {
    console.error('News Cron Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
