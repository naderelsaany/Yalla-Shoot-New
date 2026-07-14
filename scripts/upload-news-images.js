/**
 * Upload external news images to Supabase Storage
 * Usage: node scripts/upload-news-images.js
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => {
  const m = l.match(/^([^=]+)=(.*)/);
  if (m) process.env[m[1].trim()] = m[2].trim();
});

const sup = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function downloadImage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`  ❌ Download failed: ${response.status} for ${url.substring(0, 80)}`);
      return null;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.split('/')[1] || 'jpg';
    return { buffer, contentType, ext };
  } catch (e) {
    console.error(`  ❌ Download error: ${e.message}`);
    return null;
  }
}

async function uploadImage(buffer, ext, title) {
  const hash = require('crypto').createHash('md5').update(title + Date.now()).digest('hex').substring(0, 8);
  const fileName = `news-${hash}-${Date.now()}.${ext}`;
  
  const { data, error } = await sup.storage
    .from('news-images')
    .upload(fileName, buffer, {
      contentType: `image/${ext === 'svg' ? 'svg+xml' : ext === 'jpg' ? 'jpeg' : ext}`,
      upsert: true,
    });

  if (error) {
    console.error(`  ❌ Upload failed: ${error.message}`);
    return null;
  }

  const { data: urlData } = sup.storage.from('news-images').getPublicUrl(fileName);
  return urlData.publicUrl;
}

async function main() {
  console.log('🔄 Scanning news with external image URLs...\n');

  // Get all news with external image URLs
  const { data: news, error } = await sup
    .from('news')
    .select('id, title, image_url')
    .not('image_url', 'is', null)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching news:', error);
    return;
  }

  const externalNews = news.filter(n => !n.image_url.includes('supabase.co'));
  console.log(`📊 Found ${externalNews.length} news with external image URLs out of ${news.length} total\n`);

  let uploaded = 0;
  let failed = 0;

  for (const item of externalNews) {
    const url = item.image_url;
    if (!url || url.includes('supabase.co')) continue;

    console.log(`📰 ${item.title.substring(0, 60)}...`);
    console.log(`   URL: ${url.substring(0, 100)}`);

    const result = await downloadImage(url);
    if (!result) {
      failed++;
      console.log('   ⏭️ Skipping (download failed)\n');
      continue;
    }

    // Check file size (Supabase free tier limit ~5MB)
    if (result.buffer.length > 5 * 1024 * 1024) {
      console.log(`   ⚠️ File too large: ${(result.buffer.length / 1024 / 1024).toFixed(1)}MB > 5MB, skipping`);
      failed++;
      continue;
    }

    const publicUrl = await uploadImage(result.buffer, result.ext, item.title);
    if (!publicUrl) {
      failed++;
      console.log('   ⏭️ Skipping (upload failed)\n');
      continue;
    }

    // Update the news record with the new storage URL
    const { error: updateError } = await sup
      .from('news')
      .update({ image_url: publicUrl })
      .eq('id', item.id);

    if (updateError) {
      console.error(`  ❌ DB update failed: ${updateError.message}`);
      failed++;
    } else {
      console.log(`  ✅ Updated: ${publicUrl}`);
      uploaded++;
    }
    console.log('');
  }

  console.log(`\n📊 ====== SUMMARY ======`);
  console.log(`✅ Uploaded & updated: ${uploaded}`);
  console.log(`❌ Failed: ${failed}`);
}

main().catch(console.error);
