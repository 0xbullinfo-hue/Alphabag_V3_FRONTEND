/**
 * generate-og-image.js
 * Creates a 1200x630 OG/social-preview image with:
 *  - Dark background (#0d0d0d)
 *  - AlphaBAG logo centered-left
 *  - Saved as public/og-image.png
 */

import { Jimp } from 'jimp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const LOGO_SRC  = join(__dirname, '..', 'public', 'logo.png');
const OUTPUT    = join(__dirname, '..', 'public', 'og-image.png');

const OG_W = 1200;
const OG_H = 630;
// Dark background color: #0d0d0d  (fully opaque)
const BG_COLOR = 0x0d0d0dff;

async function main() {
  console.log('Loading logo...');
  const logo = await Jimp.read(LOGO_SRC);

  // Resize logo to fit nicely — 460px tall, centered vertically
  const LOGO_SIZE = 460;
  logo.resize({ w: LOGO_SIZE, h: LOGO_SIZE });

  // Create dark canvas
  const canvas = new Jimp({ width: OG_W, height: OG_H, color: BG_COLOR });

  // Position logo: centered vertically, 80px from left
  const logoX = 80;
  const logoY = Math.round((OG_H - LOGO_SIZE) / 2);

  canvas.composite(logo, logoX, logoY);

  await canvas.write(OUTPUT);
  console.log(`OG image saved: ${OUTPUT} (${OG_W}x${OG_H})`);
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
