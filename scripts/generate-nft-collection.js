import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOTAL_SUPPLY = 10000;
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'nft-collection', 'metadata');
const IPFS_IMAGE_BASE_URI = 'ipfs://__CID_PLACEHOLDER__';

// 3-Tier Definition Pool
const TIERS_CONFIG = [
  { 
    name: 'Analyst Satchel', 
    tierLevel: 'Tier 1', 
    multiplier: '1.0x Base',
    material: 'Heritage Cognac Leather',
    weight: 65,
    description: 'The foundational AlphaBAG utility satchel crafted in heritage leather with brass locking mechanisms.'
  },
  { 
    name: 'Whale Diplomat', 
    tierLevel: 'Tier 2', 
    multiplier: '1.25x Boost',
    material: 'Stealth Matte Carbon Fiber',
    weight: 30,
    description: 'The high-frequency trading briefcase with ballistic carbon fiber weave, neon BSC accents, and biometric security.'
  },
  { 
    name: 'Genesis Mythic', 
    tierLevel: 'Tier 3', 
    multiplier: '1.5x Maximum Boost',
    material: 'Iridescent Holographic Glass Crystal',
    weight: 5,
    description: 'The apex grail pass featuring a crystalline refraction chassis, active quantum plasma core, and VIP lifetime perks.'
  }
];

const TRAITS = {
  locks: [
    { name: 'Vintage Brass Lock', weight: 40 },
    { name: 'Biometric Fingerprint LED', weight: 35 },
    { name: 'Quantum Cipher Pad', weight: 25 }
  ],
  tags: [
    { name: 'ALPHA VIP BSC', weight: 40 },
    { name: 'WHALE VERIFIED', weight: 35 },
    { name: 'GENESIS FOUNDER', weight: 25 }
  ],
  stickers: [
    { name: '100x DEGEN', weight: 35 },
    { name: 'SECURED THE BAG', weight: 35 },
    { name: 'TREASURY KEY', weight: 30 }
  ],
  auras: [
    { name: 'Subtle Slate Ambient', weight: 50 },
    { name: 'Green Candlestick Orbitals', weight: 30 },
    { name: 'Quantum Refractive Lasers', weight: 20 }
  ],
  backgrounds: [
    { name: 'Dark Terminal Slate', weight: 50 },
    { name: 'Binance Dark Gold Grid', weight: 30 },
    { name: 'Midnight Cyber Matrix', weight: 20 }
  ]
};

// Weighted random selector
function getWeightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    if (random < item.weight) return item;
    random -= item.weight;
  }
  return items[0];
}

async function generateCollection() {
  console.log(`🚀 Generating 3-Tier 10,000 AlphaBAG Collection Metadata...`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const masterList = [];
  const rarityStats = {
    total: TOTAL_SUPPLY,
    tiers: { 'Tier 1: Analyst Satchel': 0, 'Tier 2: Whale Diplomat': 0, 'Tier 3: Genesis Mythic': 0 },
    materials: {},
    locks: {},
    tags: {},
    stickers: {},
    auras: {},
    backgrounds: {}
  };

  for (let tokenId = 1; tokenId <= TOTAL_SUPPLY; tokenId++) {
    let tierObj, lock, tag, sticker, aura, bg;

    // Special Genesis Founder Grails (Token #1 to #100) are guaranteed Tier 3 Mythic Crystal
    if (tokenId <= 100) {
      tierObj = TIERS_CONFIG[2]; // Tier 3 Genesis Mythic
      lock = 'Quantum Cipher Pad';
      tag = 'GENESIS FOUNDER';
      sticker = 'TREASURY KEY';
      aura = 'Quantum Refractive Lasers';
      bg = 'Binance Dark Gold Grid';
    } else {
      tierObj = getWeightedRandom(TIERS_CONFIG);
      lock = tierObj.tierLevel === 'Tier 3' ? 'Quantum Cipher Pad' : tierObj.tierLevel === 'Tier 2' ? 'Biometric Fingerprint LED' : getWeightedRandom(TRAITS.locks).name;
      tag = tierObj.tierLevel === 'Tier 3' ? 'GENESIS FOUNDER' : getWeightedRandom(TRAITS.tags).name;
      sticker = getWeightedRandom(TRAITS.stickers).name;
      aura = tierObj.tierLevel === 'Tier 3' ? 'Quantum Refractive Lasers' : getWeightedRandom(TRAITS.auras).name;
      bg = getWeightedRandom(TRAITS.backgrounds).name;
    }

    const tierKey = `${tierObj.tierLevel}: ${tierObj.name}`;
    rarityStats.tiers[tierKey] = (rarityStats.tiers[tierKey] || 0) + 1;
    rarityStats.materials[tierObj.material] = (rarityStats.materials[tierObj.material] || 0) + 1;
    rarityStats.locks[lock] = (rarityStats.locks[lock] || 0) + 1;
    rarityStats.tags[tag] = (rarityStats.tags[tag] || 0) + 1;
    rarityStats.stickers[sticker] = (rarityStats.stickers[sticker] || 0) + 1;
    rarityStats.auras[aura] = (rarityStats.auras[aura] || 0) + 1;
    rarityStats.backgrounds[bg] = (rarityStats.backgrounds[bg] || 0) + 1;

    const metadata = {
      name: `AlphaBAG ${tierObj.name} #${tokenId.toString().padStart(4, '0')}`,
      description: `${tierObj.description} Grants a ${tierObj.multiplier} ITEMS multiplier and VIP platform access across the AlphaBAG terminal ecosystem.`,
      image: `${IPFS_IMAGE_BASE_URI}/${tokenId}.png`,
      dna: Buffer.from(`${tokenId}-${tierObj.name}-${lock}-${tag}-${sticker}-${aura}-${bg}`).toString('hex'),
      edition: tokenId,
      date: Date.now(),
      attributes: [
        { trait_type: 'Access Tier', value: tierObj.tierLevel },
        { trait_type: 'Pass Model', value: tierObj.name },
        { trait_type: 'ITEMS Multiplier', value: tierObj.multiplier },
        { trait_type: 'Case Material', value: tierObj.material },
        { trait_type: 'Security Hardware', value: lock },
        { trait_type: 'Baggage Tag', value: tag },
        { trait_type: 'Decal Sticker', value: sticker },
        { trait_type: 'Alpha Aura', value: aura },
        { trait_type: 'Background', value: bg },
        { trait_type: 'Network', value: 'Binance Smart Chain (BSC)' },
        { trait_type: 'Standard', value: 'ERC-721A' }
      ],
      compiler: 'AlphaBAG Protocol Engine v3.0'
    };

    masterList.push(metadata);

    fs.writeFileSync(path.join(OUTPUT_DIR, `${tokenId}.json`), JSON.stringify(metadata, null, 2));

    if (tokenId % 2000 === 0 || tokenId === TOTAL_SUPPLY) {
      console.log(`✔ Generated ${tokenId} / ${TOTAL_SUPPLY} metadata files...`);
    }
  }

  const baseDir = path.join(__dirname, '..', 'public', 'nft-collection');
  fs.writeFileSync(path.join(baseDir, '_metadata.json'), JSON.stringify(masterList, null, 2));
  fs.writeFileSync(path.join(baseDir, 'rarity-distribution.json'), JSON.stringify(rarityStats, null, 2));

  console.log(`\n🎉 DONE! Generated all ${TOTAL_SUPPLY} 3-Tier metadata files in: ${OUTPUT_DIR}`);
  console.log(`📊 3-Tier Distribution:`, rarityStats.tiers);
}

generateCollection().catch(console.error);
