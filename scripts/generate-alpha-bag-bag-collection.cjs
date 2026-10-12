const fs = require('fs');
const path = require('path');

const COLLECTION_SIZE = 4000;
const ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'public', 'alphabag-bag-collection');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');
const METADATA_DIR = path.join(OUTPUT_DIR, 'metadata');

const COLOR_MAP = {
  'Sunset Orange': '#F57C1F',
  'Midnight Black': '#111827',
  'Arctic White': '#F5F5F5',
  'Crimson Red': '#B91C1C',
  'Forest Green': '#166534',
  'Navy Blue': '#1E3A8A',
  'Beta Black': '#0F172A',
  'Metallic Gold': '#D4AF37',
  'Yellow Plastic': '#FACC15',
  'Silver Metal': '#CBD5E1',
  'Gold Metal': '#D4AF37',
  'Neon Glow': '#22D3EE',
  'Diamond': '#C4B5FD',
  'White Solid Diagonal': '#F8FAFC',
  'Double Stripe': '#E2E8F0',
  'Glow Orange': '#F97316',
  'Glitch Digital': '#A78BFA',
  'Gold Luxury': '#D4AF37',
  'Matte': '#d9d9d9',
  'Glossy': '#ffffff',
  'Carbon Fiber': '#374151',
  'Holographic': '#67e8f9',
  'Metallic': '#fbbf24',
  'Black': '#111827',
  'Orange': '#F97316',
  'White': '#F8FAFC',
  'Gold': '#D4AF37'
};

const TIER_ORDER = ['Beta Tester', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Private OG'];
const TIER_COUNTS = {
  'Beta Tester': 500,
  'Common': 2400,
  'Uncommon': 400,
  'Rare': 400,
  'Epic': 160,
  'Legendary': 40,
  'Private OG': 100
};

const BASE_COLOR_COUNTS = {
  'Beta Black': 500,
  'Metallic Gold': 40,
  'Sunset Orange': 1400,
  'Midnight Black': 800,
  'Arctic White': 600,
  'Crimson Red': 300,
  'Forest Green': 200,
  'Navy Blue': 160
};

const STRAP_COLOR_COUNTS = {
  'Navy Blue': 1600,
  'Black': 1200,
  'Orange': 600,
  'White': 400,
  'Gold': 200
};

const ZIPPER_COUNTS = {
  'Yellow Plastic': 2000,
  'Silver Metal': 800,
  'Gold Metal': 600,
  'Neon Glow': 400,
  'Diamond': 200
};

const STRIPE_COUNTS = {
  'White Solid Diagonal': 1800,
  'No Stripe': 810,
  'Double Stripe': 600,
  'Glow Orange': 400,
  'Glitch Digital': 350,
  'Gold Luxury': 40
};

const FINISH_COUNTS = {
  'Matte': 2400,
  'Glossy': 800,
  'Carbon Fiber': 400,
  'Holographic': 300,
  'Metallic': 100
};

const BADGE_COUNTS = {
  'Beta Tester': 500,
  'Private OG': 40,
  'Alpha Pass': 60,
  'None': 3400
};

const BAG_TAG_COUNTS = {
  'Black Tag Gold Text': 40,
  'Black Tag Orange Text': 500,
  'White Tag Gold Text': 400,
  'White Tag Black Text': 3060
};

function buildTierMap() {
  const tierMap = new Map();
  let cursor = 1;
  for (const tier of TIER_ORDER) {
    for (let idx = 0; idx < TIER_COUNTS[tier]; idx++) {
      tierMap.set(cursor++, tier);
    }
  }
  return tierMap;
}

function shuffle(list) {
  const data = [...list];
  for (let i = data.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [data[i], data[j]] = [data[j], data[i]];
  }
  return data;
}

function assignTraitByCounts(ids, counts, allowedFn) {
  const assignment = new Map();
  const entries = Object.entries(counts).sort((a, b) => {
    const aEligible = ids.filter(id => allowedFn(id, a[0])).length;
    const bEligible = ids.filter(id => allowedFn(id, b[0])).length;
    return aEligible - bEligible;
  });

  for (const [value, count] of entries) {
    const candidates = ids.filter(id => allowedFn(id, value));
    if (candidates.length < count) {
      throw new Error(`Trait ${value} needs ${count} but only ${candidates.length} IDs match the allowed tier rules.`);
    }

    const chosen = shuffle(candidates).slice(0, count);
    for (const id of chosen) {
      assignment.set(id, value);
    }
  }

  return assignment;
}

function formatAttribute(name, value) {
  return { trait_type: name, value };
}

function bagSvg({ baseColor, strapColor, zipperPull, stripeType, finish, badge, bagTag }) {
  const base = COLOR_MAP[baseColor] || '#F57C1F';
  const strap = COLOR_MAP[strapColor] || '#1E3A8A';
  const zipper = COLOR_MAP[zipperPull] || '#FACC15';
  const stripeColor = stripeType === 'Gold Luxury' ? '#D4AF37' : stripeType === 'Glitch Digital' ? '#A78BFA' : stripeType === 'Glow Orange' ? '#F97316' : '#F8FAFC';
  const bodyFill = finish === 'Carbon Fiber' ? 'url(#carbon)' : finish === 'Holographic' ? 'url(#holo)' : base;

  const stripeMarkup = stripeType === 'No Stripe'
    ? ''
    : stripeType === 'Double Stripe'
      ? '<path d="M246 340 L518 340 L465 570 L192 570 Z" fill="#F8FAFC" opacity="0.95"/><path d="M292 395 L500 395 L460 540 L236 540 Z" fill="#F8FAFC" opacity="0.95"/>'
      : stripeType === 'Glow Orange'
        ? '<path d="M256 332 L514 332 L602 596 L192 596 Z" fill="#F97316" opacity="0.96"/><path d="M230 360 L510 360 L470 550 L190 550 Z" fill="#F97316" opacity="0.2"/>'
        : stripeType === 'Glitch Digital'
          ? '<path d="M236 332 L514 332 L600 600 L190 600 Z" fill="#A78BFA" opacity="0.96"/><path d="M240 370 L470 370 L510 540 L205 540 Z" fill="#F8FAFC" opacity="0.18"/>'
          : stripeType === 'Gold Luxury'
            ? '<path d="M230 332 L530 332 L598 600 L160 600 Z" fill="#D4AF37" opacity="0.96"/>'
            : '<path d="M230 332 L530 332 L598 600 L160 600 Z" fill="'+stripeColor+'" opacity="0.96"/>';

  const bagTagMarkup = bagTag === 'White Tag Black Text'
    ? ''
    : bagTag === 'Black Tag Orange Text'
      ? '<g transform="translate(458 126)"><rect x="0" y="0" width="70" height="28" rx="8" fill="#111827" stroke="#F97316" stroke-width="2"/><text x="35" y="19" text-anchor="middle" font-size="12" font-weight="900" fill="#F97316" font-family="Arial, sans-serif">BAG</text></g>'
      : bagTag === 'White Tag Gold Text'
        ? '<g transform="translate(458 126)"><rect x="0" y="0" width="70" height="28" rx="8" fill="#F8FAFC" stroke="#D4AF37" stroke-width="2"/><text x="35" y="19" text-anchor="middle" font-size="12" font-weight="900" fill="#D4AF37" font-family="Arial, sans-serif">BAG</text></g>'
        : '<g transform="translate(458 126)"><rect x="0" y="0" width="70" height="28" rx="8" fill="#111827" stroke="#D4AF37" stroke-width="2"/><text x="35" y="19" text-anchor="middle" font-size="12" font-weight="900" fill="#D4AF37" font-family="Arial, sans-serif">BAG</text></g>';

  const badgeMarkup = badge === 'None'
    ? ''
    : badge === 'Beta Tester'
      ? '<g transform="translate(284 156)"><rect x="0" y="0" width="76" height="24" rx="8" fill="#0F172A" stroke="#F8FAFC" stroke-width="2"/><text x="38" y="16" text-anchor="middle" font-size="11" font-weight="900" fill="#F8FAFC" font-family="Arial, sans-serif">BETA</text></g>'
      : badge === 'Alpha Pass'
        ? '<g transform="translate(284 156)"><rect x="0" y="0" width="76" height="24" rx="8" fill="#F59E0B" stroke="#F8FAFC" stroke-width="2"/><text x="38" y="16" text-anchor="middle" font-size="10" font-weight="900" fill="#111827" font-family="Arial, sans-serif">ALPHA</text></g>'
        : '<g transform="translate(284 156)"><rect x="0" y="0" width="76" height="24" rx="8" fill="#F8FAFC" stroke="#0F172A" stroke-width="2"/><text x="38" y="16" text-anchor="middle" font-size="12" font-weight="900" fill="#0F172A" font-family="Arial, sans-serif">OG</text></g>';

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1400" viewBox="0 0 800 800">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="16" stdDeviation="10" flood-color="#000000" flood-opacity="0.22"/>
      </filter>
      <linearGradient id="bodyGradient" x1="0" x2="1">
        <stop offset="0%" stop-color="#f8a534"/>
        <stop offset="25%" stop-color="${base}"/>
        <stop offset="55%" stop-color="#f15a1a"/>
        <stop offset="100%" stop-color="#b61d1d"/>
      </linearGradient>
      <pattern id="carbon" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="${base}"/>
        <path d="M0 0 L8 8 M8 0 L0 8" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      </pattern>
      <linearGradient id="holo" x1="0" x2="1">
        <stop offset="0%" stop-color="#f8fafc"/>
        <stop offset="25%" stop-color="#67e8f9"/>
        <stop offset="50%" stop-color="#fce7f3"/>
        <stop offset="75%" stop-color="#a78bfa"/>
        <stop offset="100%" stop-color="#f8fafc"/>
      </linearGradient>
    </defs>
    <rect width="800" height="800" fill="#efefef"/>
    <ellipse cx="398" cy="666" rx="270" ry="44" fill="rgba(15,23,42,0.18)"/>
    <g filter="url(#shadow)">
      <path d="M115 232 C105 178 132 128 184 112 L610 112 C690 122 718 184 706 232 L726 286 C740 304 748 332 748 350 L748 542 C748 606 696 648 628 658 L173 658 C104 648 52 606 52 542 L52 350 C52 332 60 304 74 286 Z" fill="url(#bodyGradient)" stroke="#0F172A" stroke-width="22"/>
      <path d="M182 120 C184 90 198 67 230 55 C262 43 316 52 358 58 L448 58 C488 52 540 43 576 55 C605 66 622 92 624 120 L636 160 C642 176 627 194 609 194 H194 C177 194 162 176 167 160 Z" fill="${strap}" stroke="#0F172A" stroke-width="18"/>
      <path d="M210 138 C218 112 234 96 262 88 C282 82 322 80 400 80 C478 80 520 82 538 88 C564 96 582 110 590 138 C594 150 584 162 570 162 H230 C216 162 206 150 210 138 Z" fill="${strap}"/>
      <path d="M150 278 L270 278 L270 610 L150 610 Z" fill="${strap}" opacity="0.9"/>
      <path d="M630 278 L650 278 L650 610 L630 610 Z" fill="${strap}" opacity="0.9"/>
      <path d="M130 264 L670 264 L650 610 L150 610 Z" fill="${bodyFill}" opacity="0.9"/>
      <path d="M235 320 L540 320 L510 588 L192 588 Z" fill="${base}" opacity="0.82"/>
      ${stripeMarkup}
      <path d="M258 316 L518 362 L472 560 L198 514 Z" fill="rgba(255,255,255,0.08)"/>
      <rect x="280" y="324" width="214" height="34" rx="18" fill="${zipper}" stroke="#0F172A" stroke-width="8"/>
      <rect x="334" y="340" width="104" height="12" rx="6" fill="rgba(255,255,255,0.75)"/>
      <path d="M185 542 L615 542 L600 612 L200 612 Z" fill="${strap}" opacity="0.96" stroke="#0F172A" stroke-width="10"/>
      <path d="M212 552 L588 552" stroke="#0F172A" stroke-width="8" opacity="0.7"/>
      ${badgeMarkup}
      ${bagTagMarkup}
    </g>
  </svg>
  `;
}

function generateCollection() {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  fs.mkdirSync(METADATA_DIR, { recursive: true });

  const tierMap = buildTierMap();
  const allIds = Array.from({ length: COLLECTION_SIZE }, (_, i) => i + 1);

  const baseColorAssignments = assignTraitByCounts(allIds, BASE_COLOR_COUNTS, (id, value) => {
    const tier = tierMap.get(id);
    if (value === 'Beta Black') return tier === 'Beta Tester';
    if (value === 'Metallic Gold') return tier === 'Legendary';
    return ['Sunset Orange', 'Midnight Black', 'Arctic White', 'Crimson Red', 'Forest Green', 'Navy Blue'].includes(value);
  });

  const strapAssignments = assignTraitByCounts(allIds, STRAP_COLOR_COUNTS, (id, value) => {
    const tier = tierMap.get(id);
    if (value === 'Gold') return ['Rare', 'Epic', 'Legendary'].includes(tier);
    return ['Navy Blue', 'Black', 'Orange', 'White'].includes(value);
  });

  const zipperAssignments = assignTraitByCounts(allIds, ZIPPER_COUNTS, (id, value) => {
    const tier = tierMap.get(id);
    if (value === 'Diamond') return ['Rare', 'Legendary'].includes(tier);
    if (value === 'Neon Glow') return ['Beta Tester', 'Epic'].includes(tier);
    if (value === 'Gold Metal') return ['Rare', 'Epic', 'Legendary'].includes(tier);
    return true;
  });

  const stripeAssignments = assignTraitByCounts(allIds, STRIPE_COUNTS, (id, value) => {
    const tier = tierMap.get(id);
    if (value === 'Gold Luxury') return tier === 'Legendary';
    if (value === 'Glitch Digital') return ['Beta Tester', 'Epic'].includes(tier);
    return true;
  });

  const finishAssignments = assignTraitByCounts(allIds, FINISH_COUNTS, (id, value) => {
    const tier = tierMap.get(id);
    if (value === 'Metallic') return ['Epic', 'Legendary'].includes(tier);
    return true;
  });

  const badgeAssignments = assignTraitByCounts(allIds, BADGE_COUNTS, (id, value) => {
    const tier = tierMap.get(id);
    if (value === 'Beta Tester') return tier === 'Beta Tester';
    if (value === 'Alpha Pass') return ['Epic', 'Legendary'].includes(tier);
    if (value === 'Private OG') return tier === 'Private OG';
    return value === 'None';
  });

  const bagTagAssignments = assignTraitByCounts(allIds, BAG_TAG_COUNTS, (id, value) => {
    const tier = tierMap.get(id);
    if (value === 'Black Tag Orange Text') return tier === 'Beta Tester';
    if (value === 'White Tag Gold Text') return ['Rare', 'Epic'].includes(tier);
    if (value === 'Black Tag Gold Text') return tier === 'Legendary';
    return true;
  });

  const master = [];
  const rarityStats = {};

  for (let i = 1; i <= COLLECTION_SIZE; i++) {
    const tier = tierMap.get(i);
    const baseColor = baseColorAssignments.get(i);
    const strapColor = strapAssignments.get(i);
    const zipperPull = zipperAssignments.get(i);
    const stripeType = stripeAssignments.get(i);
    const finish = finishAssignments.get(i);
    const badge = badgeAssignments.get(i);
    const bagTag = bagTagAssignments.get(i);

    const attributes = [
      formatAttribute('Tier', tier),
      formatAttribute('Base Color', baseColor),
      formatAttribute('Strap Color', strapColor),
      formatAttribute('Zipper Pull', zipperPull),
      formatAttribute('Stripe Type', stripeType),
      formatAttribute('Finish / Material', finish),
      formatAttribute('Badge / Patch', badge),
      formatAttribute('BAG Tag', bagTag)
    ];

    const metadata = {
      name: `AlphaBAG Duffel #${i}`,
      description: `A collectible AlphaBAG duffel NFT with ${tier} rarity and layered traits: ${baseColor}, ${strapColor}, ${zipperPull}, ${stripeType}, ${finish}, ${badge}, ${bagTag}.`,
      image: `/alphabag-bag-collection/images/${i}.svg`,
      dna: `alphabag-bag-${i}-${tier}-${baseColor}-${strapColor}-${zipperPull}-${stripeType}-${finish}-${badge}-${bagTag}`,
      edition: i,
      attributes,
      compiler: 'AlphaBAG Bag Collection Generator'
    };

    fs.writeFileSync(path.join(METADATA_DIR, `${i}.json`), JSON.stringify(metadata, null, 2));
    fs.writeFileSync(path.join(IMAGES_DIR, `${i}.svg`), bagSvg({ baseColor, strapColor, zipperPull, stripeType, finish, badge, bagTag }));
    master.push(metadata);

    for (const attr of attributes) {
      rarityStats[attr.trait_type] ??= {};
      rarityStats[attr.trait_type][attr.value] = (rarityStats[attr.trait_type][attr.value] || 0) + 1;
    }
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, '_metadata.json'), JSON.stringify(master, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'rarity-distribution.json'), JSON.stringify({ totalSupply: COLLECTION_SIZE, traits: rarityStats }, null, 2));
  console.log(`Generated ${COLLECTION_SIZE} AlphaBAG bag NFTs in ${OUTPUT_DIR}`);
  console.log('Tier counts:', TIER_COUNTS);
}

generateCollection();
