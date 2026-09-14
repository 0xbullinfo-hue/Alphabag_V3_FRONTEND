const fs = require('fs');
const path = require('path');

const TOTAL_SUPPLY = 4000;

// Trait allocations requested by user:
// Common: 50% (2000)
// Rare: 25% (1000)
// Epic: 15% (600)
// Legendary: 8% (320)
// Mythic: 2% (80)
const TRAIT_CONFIG = {
  Common: {
    allocation: '50%',
    percentage: 50,
    count: 2000,
    multiplier: '1.25x',
    color: '#F97316',
    image: '/nft-collection/tiers/common.png',
    tierImageName: 'common.png',
    attributes: {
      Material: 'Vibrant Athletic Cordura',
      Lock: 'Steel Carabiner',
      Strap: 'Navy Tactical Weave',
      Zippers: 'Safety Gold Dual Pulls',
      Stripe: 'Olympic Pure White',
      Utility: 'Standard ITEMS Boost + Alpha Signals',
      Multiplier: '1.25x'
    }
  },
  Rare: {
    allocation: '25%',
    percentage: 25,
    count: 1000,
    multiplier: '1.5x',
    color: '#06B6D4',
    image: '/nft-collection/tiers/rare.png',
    tierImageName: 'rare.png',
    attributes: {
      Material: 'Electric Cyan Hydro-Fabric',
      Lock: 'Quantum Padlock',
      Strap: 'Deep Midnight Weave',
      Zippers: 'Electric Aqua Dual Pulls',
      Stripe: 'Reflective Cyber White',
      Utility: '1.5x ITEMS Boost + Whale Radar Access',
      Multiplier: '1.5x'
    }
  },
  Epic: {
    allocation: '15%',
    percentage: 15,
    count: 600,
    multiplier: '2.0x',
    color: '#A855F7',
    image: '/nft-collection/tiers/epic.png',
    tierImageName: 'epic.png',
    attributes: {
      Material: 'Cyber Violet Carbon-Weave',
      Lock: 'Biometric Neon Clasp',
      Strap: 'Synthwave Purple Webbing',
      Zippers: 'Luminous Violet Neon Pulls',
      Stripe: 'Hot Magenta & Lilac Racing Stripes',
      Utility: '2.0x ITEMS Boost + Unlimited AlphaAI',
      Multiplier: '2.0x'
    }
  },
  Legendary: {
    allocation: '8%',
    percentage: 8,
    count: 320,
    multiplier: '3.0x',
    color: '#FCD535',
    image: '/nft-collection/tiers/legendary.png',
    tierImageName: 'legendary.png',
    attributes: {
      Material: '24K Solid Gold & Obsidian Satin',
      Lock: 'Cryptographic Gold Padlock',
      Strap: '24K Gold Plated Straps',
      Zippers: 'Solid Gold Radiant Pulls',
      Stripe: 'Polished 24K Gold Ingot Plate',
      Utility: '3.0x ITEMS Boost + Private Founder Calls',
      Multiplier: '3.0x'
    }
  },
  Mythic: {
    allocation: '2%',
    percentage: 2,
    count: 80,
    multiplier: '5.0x',
    color: '#EC4899',
    image: '/nft-collection/tiers/mythic.png',
    tierImageName: 'mythic.png',
    attributes: {
      Material: 'Prismatic Crystal & Iridescent Diamond',
      Lock: 'Celestial Shard Core',
      Strap: 'Diamond Hexagonal Grid',
      Zippers: 'Floating Aurora Crystal Relics',
      Stripe: 'Rainbow Refractive Prismatic Beam',
      Utility: '5.0x ITEMS Boost + Apex Lifetime VIP Unlocks',
      Multiplier: '5.0x'
    }
  }
};

// Deterministic pseudo-random shuffle for token distribution
let tokenTiers = [];
for (let i = 0; i < 2000; i++) tokenTiers.push('Common');
for (let i = 0; i < 1000; i++) tokenTiers.push('Rare');
for (let i = 0; i < 600; i++) tokenTiers.push('Epic');
for (let i = 0; i < 320; i++) tokenTiers.push('Legendary');
for (let i = 0; i < 80; i++) tokenTiers.push('Mythic');

// Seeded deterministic shuffle
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

for (let i = tokenTiers.length - 1; i > 0; i--) {
  const j = Math.floor(seededRandom(i * 777 + 42) * (i + 1));
  [tokenTiers[i], tokenTiers[j]] = [tokenTiers[j], tokenTiers[i]];
}

// Generate tokens metadata
const allMetadata = [];
const metadataDir = path.join(__dirname, '../public/nft-collection/metadata');
const imagesDir = path.join(__dirname, '../public/nft-collection/images');
const tiersDir = path.join(__dirname, '../public/nft-collection/tiers');

if (!fs.existsSync(metadataDir)) fs.mkdirSync(metadataDir, { recursive: true });
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

const rarityDistribution = {
  total: TOTAL_SUPPLY,
  collectionName: 'AlphaBAG Genesis Pass Collection',
  traits: {
    Common: {
      allocation: '50%',
      count: 2000,
      multiplier: '1.25x',
      color: '#F97316',
      perks: ['1.25x ITEMS Boost', 'Standard Dashboard Access', 'Alpha Signals']
    },
    Rare: {
      allocation: '25%',
      count: 1000,
      multiplier: '1.5x',
      color: '#06B6D4',
      perks: ['1.5x ITEMS Boost', 'Whale Radar Access', 'Priority Feeds']
    },
    Epic: {
      allocation: '15%',
      count: 600,
      multiplier: '2.0x',
      color: '#A855F7',
      perks: ['2.0x ITEMS Boost', 'Full Pro Analytics', 'AlphaAI Unlimited']
    },
    Legendary: {
      allocation: '8%',
      count: 320,
      multiplier: '3.0x',
      color: '#FCD535',
      perks: ['3.0x ITEMS Boost', 'Private Founder Calls', 'Telegram VIP Alerts']
    },
    Mythic: {
      allocation: '2%',
      count: 80,
      multiplier: '5.0x',
      color: '#EC4899',
      perks: ['5.0x ITEMS Boost', '100% Platform Unlocks', 'Apex VIP Lifetime Access']
    }
  }
};

fs.writeFileSync(
  path.join(__dirname, '../public/nft-collection/rarity-distribution.json'),
  JSON.stringify(rarityDistribution, null, 2)
);

// Populate individual metadata and image files for first 200 tokens (fast preview)
// and write complete _metadata.json for all 4000
for (let id = 1; id <= TOTAL_SUPPLY; id++) {
  const tierName = tokenTiers[id - 1];
  const tierInfo = TRAIT_CONFIG[tierName];

  const tokenMeta = {
    name: `AlphaBAG Genesis Pass #${id}`,
    description: `Official AlphaBAG Genesis Pass #${id} granting ${tierInfo.multiplier} boost and ${tierName} platform privileges.`,
    image: tierInfo.image,
    external_url: `https://alphabag.app/alpha-passes?token=${id}`,
    attributes: [
      { trait_type: 'Rarity Tier', value: tierName },
      { trait_type: 'Allocation', value: tierInfo.allocation },
      { trait_type: 'Multiplier', value: tierInfo.multiplier },
      { trait_type: 'Material', value: tierInfo.attributes.Material },
      { trait_type: 'Lock', value: tierInfo.attributes.Lock },
      { trait_type: 'Strap', value: tierInfo.attributes.Strap },
      { trait_type: 'Zippers', value: tierInfo.attributes.Zippers },
      { trait_type: 'Stripe', value: tierInfo.attributes.Stripe },
      { trait_type: 'Utility', value: tierInfo.attributes.Utility }
    ]
  };

  allMetadata.push(tokenMeta);

  if (id <= 200) {
    fs.writeFileSync(path.join(metadataDir, `${id}.json`), JSON.stringify(tokenMeta, null, 2));
    const srcTierImg = path.join(tiersDir, tierInfo.tierImageName);
    const destImg = path.join(imagesDir, `${id}.png`);
    if (fs.existsSync(srcTierImg)) {
      fs.copyFileSync(srcTierImg, destImg);
    }
  }
}

fs.writeFileSync(
  path.join(__dirname, '../public/nft-collection/_metadata.json'),
  JSON.stringify(allMetadata, null, 2)
);

console.log('Successfully generated 4000 NFT metadata & distribution:');
console.log(`- Common (50%): 2,000`);
console.log(`- Rare (25%): 1,000`);
console.log(`- Epic (15%): 600`);
console.log(`- Legendary (8%): 320`);
console.log(`- Mythic (2%): 80`);
