/**
 * remove-bg.js  (Jimp v1 ESM API)
 * Converts logo JPEG to transparent PNG by flood-fill removing white/near-white background.
 */

import { Jimp, rgbaToInt, intToRGBA } from 'jimp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const INPUT  = join(__dirname, '..', 'public', 'logo.png');
const OUTPUT = join(__dirname, '..', 'public', 'logo.png');

// Tolerance 0–255: how far from pure white a pixel can be to still count as background
const TOLERANCE = 35;

function isNearWhite(rgba) {
  return rgba.r >= (255 - TOLERANCE) &&
         rgba.g >= (255 - TOLERANCE) &&
         rgba.b >= (255 - TOLERANCE);
}

async function main() {
  console.log('Loading image...');
  const img = await Jimp.read(INPUT);
  const w = img.width;
  const h = img.height;

  console.log(`Image size: ${w}x${h}`);

  const visited = new Uint8Array(w * h);
  const queue   = [];

  function enqueue(x, y) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const idx = y * w + x;
    if (visited[idx]) return;
    const pixel = img.getPixelColor(x, y);
    const rgba  = intToRGBA(pixel);
    if (!isNearWhite(rgba)) return;
    visited[idx] = 1;
    queue.push(x, y);  // push pair flat for speed
  }

  // Seed from all four edges
  for (let x = 0; x < w; x++) { enqueue(x, 0); enqueue(x, h - 1); }
  for (let y = 0; y < h; y++) { enqueue(0, y); enqueue(w - 1, y); }

  const TRANSPARENT = rgbaToInt(0, 0, 0, 0);
  let count = 0;

  while (queue.length > 0) {
    const cy = queue.pop();
    const cx = queue.pop();
    img.setPixelColor(TRANSPARENT, cx, cy);
    count++;
    enqueue(cx + 1, cy);
    enqueue(cx - 1, cy);
    enqueue(cx, cy + 1);
    enqueue(cx, cy - 1);
  }

  console.log(`Made ${count} background pixels transparent.`);

  await img.write(OUTPUT);
  console.log(`Saved transparent PNG: ${OUTPUT}`);
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
