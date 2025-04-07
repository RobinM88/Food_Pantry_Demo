import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceIcon = join(__dirname, '../src/assets/icon.svg');
const publicDir = join(__dirname, '../public');

// Ensure public directory exists
if (!existsSync(publicDir)) {
  mkdirSync(publicDir);
}

// Generate PWA icons
async function generateIcons() {
  try {
    // Generate 192x192 icon
    await sharp(sourceIcon)
      .resize(192, 192)
      .toFile(join(publicDir, 'pwa-192x192.png'));

    // Generate 512x512 icon
    await sharp(sourceIcon)
      .resize(512, 512)
      .toFile(join(publicDir, 'pwa-512x512.png'));

    // Generate favicon
    await sharp(sourceIcon)
      .resize(32, 32)
      .toFile(join(publicDir, 'favicon.ico'));

    // Generate apple touch icon
    await sharp(sourceIcon)
      .resize(180, 180)
      .toFile(join(publicDir, 'apple-touch-icon.png'));

    // Generate masked icon
    await sharp(sourceIcon)
      .resize(512, 512)
      .toFile(join(publicDir, 'masked-icon.svg'));

    console.log('✅ PWA icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating PWA icons:', error);
    process.exit(1);
  }
}

generateIcons(); 