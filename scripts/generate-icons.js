const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const INPUT_LOGO = path.join(__dirname, '..', 'logo.png');
const APP_DIR = path.join(__dirname, '..', 'src', 'app');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

async function generateIcons() {
  if (!fs.existsSync(INPUT_LOGO)) {
    console.error('❌ logo.png not found in root directory!');
    return;
  }

  console.log('🖼️  Processing logo.png...');

  try {
    // 1. App Icon (for browser tabs - Replaces favicon.ico in Next.js 14)
    await sharp(INPUT_LOGO)
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(path.join(APP_DIR, 'icon.png'));
    console.log('✅ Created icon.png (512x512)');

    // 2. Apple Touch Icon (for iOS Home Screen)
    await sharp(INPUT_LOGO)
      .resize(180, 180, { fit: 'contain', background: { r: 10, g: 14, b: 23, alpha: 1 } }) // #0a0e17 background
      .toFile(path.join(APP_DIR, 'apple-icon.png'));
    console.log('✅ Created apple-icon.png (180x180)');

    // 3. Open Graph Image (1200x630 for Facebook, WhatsApp, etc)
    // We'll create a nice padded version on the #0a0e17 background
    await sharp({
      create: {
        width: 1200,
        height: 630,
        channels: 4,
        background: { r: 10, g: 14, b: 23, alpha: 1 } // #0a0e17
      }
    })
      .composite([
        {
          input: await sharp(INPUT_LOGO).resize(800, 400, { fit: 'inside' }).toBuffer(),
          gravity: 'center'
        }
      ])
      .toFile(path.join(APP_DIR, 'opengraph-image.png'));
    console.log('✅ Created opengraph-image.png (1200x630)');

    // 4. Twitter Image (1200x600 for Twitter cards)
    await sharp({
      create: {
        width: 1200,
        height: 600,
        channels: 4,
        background: { r: 10, g: 14, b: 23, alpha: 1 } // #0a0e17
      }
    })
      .composite([
        {
          input: await sharp(INPUT_LOGO).resize(800, 400, { fit: 'inside' }).toBuffer(),
          gravity: 'center'
        }
      ])
      .toFile(path.join(APP_DIR, 'twitter-image.png'));
    console.log('✅ Created twitter-image.png (1200x600)');

    // 5. PWA Icons for public/ directory (optional but good for manifest)
    await sharp(INPUT_LOGO)
      .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(path.join(PUBLIC_DIR, 'icon-192.png'));
    console.log('✅ Created public/icon-192.png');

    await sharp(INPUT_LOGO)
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(path.join(PUBLIC_DIR, 'icon-512.png'));
    console.log('✅ Created public/icon-512.png');

    // Remove the default Next.js Vercel SVG/ICO if they exist
    const defaultFavicon = path.join(APP_DIR, 'favicon.ico');
    if (fs.existsSync(defaultFavicon)) {
      fs.unlinkSync(defaultFavicon);
      console.log('🗑️  Removed default Next.js favicon.ico');
    }

    console.log('🎉 All SEO icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
  }
}

generateIcons();
