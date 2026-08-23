import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'nft-collection', 'images');
const METADATA_DIR = path.join(__dirname, '..', 'public', 'nft-collection', 'metadata');

const ART_SOURCES = {
  tier1: 'C:\\Users\\1\\.gemini\\antigravity-ide\\brain\\979d9561-260b-4de6-be4b-8fa0c6f022cf\\tier1_black_metal_chocolate_1787479726178.jpg',
  tier2: 'C:\\Users\\1\\.gemini\\antigravity-ide\\brain\\979d9561-260b-4de6-be4b-8fa0c6f022cf\\tier2_minimal_bitcoin_engraved_1787480408089.jpg',
  tier3: 'C:\\Users\\1\\.gemini\\antigravity-ide\\brain\\979d9561-260b-4de6-be4b-8fa0c6f022cf\\tier3_genesis_mythic_updated_1787480678186.jpg'
};

async function buildImages() {
  console.log(`🚀 Starting generation of 1.png through 10000.png matching metadata...`);

  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  // Pre-load the 3 source image buffers into RAM for lightning fast writing
  const tier1Buf = fs.readFileSync(ART_SOURCES.tier1);
  const tier2Buf = fs.readFileSync(ART_SOURCES.tier2);
  const tier3Buf = fs.readFileSync(ART_SOURCES.tier3);

  const total = 10000;
  let t1Count = 0;
  let t2Count = 0;
  let t3Count = 0;

  for (let tokenId = 1; tokenId <= total; tokenId++) {
    const metaPath = path.join(METADATA_DIR, `${tokenId}.json`);
    let chosenBuf = tier1Buf;

    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        const tierAttr = meta.attributes.find(a => a.trait_type === 'Access Tier');
        const passModel = meta.attributes.find(a => a.trait_type === 'Pass Model');

        if (tierAttr?.value === 'Tier 3' || passModel?.value === 'Genesis Mythic' || tokenId <= 100) {
          chosenBuf = tier3Buf;
          t3Count++;
        } else if (tierAttr?.value === 'Tier 2' || passModel?.value === 'Whale Diplomat') {
          chosenBuf = tier2Buf;
          t2Count++;
        } else {
          chosenBuf = tier1Buf;
          t1Count++;
        }
      } catch (err) {
        chosenBuf = tier1Buf;
        t1Count++;
      }
    } else {
      chosenBuf = tier1Buf;
      t1Count++;
    }

    // Write image
    fs.writeFileSync(path.join(IMAGES_DIR, `${tokenId}.png`), chosenBuf);

    if (tokenId % 2000 === 0 || tokenId === total) {
      console.log(`✔ Processed ${tokenId} / ${total} images...`);
    }
  }

  console.log(`\n🎉 DONE! All 10,000 image files (1.png to 10000.png) generated in: ${IMAGES_DIR}`);
  console.log(`📊 Image Counts - Tier 1: ${t1Count} | Tier 2: ${t2Count} | Tier 3: ${t3Count}`);
}

buildImages().catch(console.error);
