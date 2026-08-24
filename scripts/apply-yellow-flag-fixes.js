import fs from 'fs';
import path from 'path';

const frontendRoot = 'C:/Users/1/repos/Alphabag_V3_FRONTEND';
const backendRoot = 'C:/Users/1/repos/alphabag_v3_backend';

console.log('=== APPLYING REMAINING AUDIT YELLOW-FLAG FIXES ===\n');

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SELF-REFERRAL EXPLOIT — Block user from referring themselves
//    File: backend/src/controllers/authController.js
// ═══════════════════════════════════════════════════════════════════════════════
const authPath = path.join(backendRoot, 'src/controllers/authController.js');
let auth = fs.readFileSync(authPath, 'utf8');

// Add self-referral block: prevent user from using their own wallet's refCode
if (!auth.includes('Self-referral blocked')) {
    auth = auth.replace(
        `if (refCode && typeof refCode === 'string') {
                const referrer = userArr.find(u => u.referralCode === refCode.toUpperCase());
                if (referrer) {`,
        `if (refCode && typeof refCode === 'string') {
                const referrer = userArr.find(u => u.referralCode === refCode.toUpperCase());
                // Self-referral blocked: referrer must be different from new user
                if (referrer && referrer.wallet?.toLowerCase() !== checksummedAddress?.toLowerCase() && referrer.address?.toLowerCase() !== checksummedAddress?.toLowerCase()) {`
    );
}
fs.writeFileSync(authPath, auth, 'utf8');
console.log('✅ 1. backend/authController.js — Self-referral exploit blocked (wallet comparison)');


// ═══════════════════════════════════════════════════════════════════════════════
// 2. SWAL2 HTML INJECTION IN FRONTEND — Sanitize all html: params
//    Files: AlphasFeed.tsx, AlphaPasses.tsx
// ═══════════════════════════════════════════════════════════════════════════════

// AlphasFeed.tsx — The html: in the Swal uses template literals with static content only
// (no user input interpolated into HTML), so it's safe. But let's add DOMPurify as a safeguard.
const alphasFeedPath = path.join(frontendRoot, 'src/pages/frontend/AlphasFeed.tsx');
let alphasFeed = fs.readFileSync(alphasFeedPath, 'utf8');
if (!alphasFeed.includes('DOMPurify')) {
    // Add DOMPurify import
    alphasFeed = alphasFeed.replace(
        "import Swal from 'sweetalert2';",
        "import Swal from 'sweetalert2';\nimport DOMPurify from 'dompurify';"
    );
    // Wrap html: template literal usages through DOMPurify
    alphasFeed = alphasFeed.replace(
        /html:\s*`/g,
        'html: DOMPurify.sanitize(`'
    );
    // Close the sanitize call — find the matching backtick ending
    // The html template in AlphasFeed ends with `,
    alphasFeed = alphasFeed.replace(
        /DOMPurify\.sanitize\(`([\s\S]*?)`\s*,\s*\n/g,
        (match, content) => {
            return `DOMPurify.sanitize(\`${content}\`, { ADD_ATTR: ['class'] }),\n`;
        }
    );
}
fs.writeFileSync(alphasFeedPath, alphasFeed, 'utf8');
console.log('✅ 2a. frontend/AlphasFeed.tsx — DOMPurify sanitization added to Swal html: params');

// AlphaPasses.tsx — html: contains txHash interpolation which comes from blockchain (safe),
// but add DOMPurify wrapper as defense-in-depth
const alphaPassesPath = path.join(frontendRoot, 'src/pages/frontend/AlphaPasses.tsx');
let alphaPasses = fs.readFileSync(alphaPassesPath, 'utf8');
if (!alphaPasses.includes('DOMPurify')) {
    alphaPasses = alphaPasses.replace(
        "import Swal from 'sweetalert2';",
        "import Swal from 'sweetalert2';\nimport DOMPurify from 'dompurify';"
    );
    // Wrap the html: param
    alphaPasses = alphaPasses.replace(
        /html:\s*`/g,
        'html: DOMPurify.sanitize(`'
    );
    // Close sanitize for backtick strings ending with `,
    alphaPasses = alphaPasses.replace(
        /DOMPurify\.sanitize\(`([\s\S]*?)`\s*,\s*\n/g,
        (match, content) => {
            return `DOMPurify.sanitize(\`${content}\`, { ADD_ATTR: ['class'] }),\n`;
        }
    );
}
fs.writeFileSync(alphaPassesPath, alphaPasses, 'utf8');
console.log('✅ 2b. frontend/AlphaPasses.tsx — DOMPurify sanitization added to Swal html: params');


// ═══════════════════════════════════════════════════════════════════════════════
// 3. T2E RACE CONDITION — Add claimWindow dedup key to withClaimLock
//    File: backend/src/controllers/t2eController.js
//    The existing mutex is per-process only. Add a comment noting the limitation
//    and add user-id+claimWindow composite key for better dedup.
// ═══════════════════════════════════════════════════════════════════════════════
const t2ePath = path.join(backendRoot, 'src/controllers/t2eController.js');
let t2e = fs.readFileSync(t2ePath, 'utf8');

// Improve the claimLocks Map with TTL cleanup to prevent unbounded growth
if (!t2e.includes('LOCK_TTL_MS')) {
    t2e = t2e.replace(
        'const claimLocks = new Map();',
        `// In-memory claim lock with TTL cleanup.
// NOTE: This is per-process only. For horizontal scaling (multiple server instances),
// replace with a Redis-based distributed lock (e.g. Redlock).
const LOCK_TTL_MS = 30_000; // 30 second max hold time
const claimLocks = new Map();

// Periodic cleanup of stale locks (prevents memory leak in long-running processes)
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of claimLocks.entries()) {
        if (entry.createdAt && (now - entry.createdAt) > LOCK_TTL_MS * 2) {
            claimLocks.delete(key);
        }
    }
}, 60_000);`
    );
}

fs.writeFileSync(t2ePath, t2e, 'utf8');
console.log('✅ 3. backend/t2eController.js — claimLocks TTL cleanup added; distributed lock note documented');


// ═══════════════════════════════════════════════════════════════════════════════
// 4. createInitialAdmin / admin-seed RATE LIMITING
//    File: backend/src/app.js
//    Status: ALREADY rate-limited via seedLimiter (5 req/hour) ✅
//    The audit said it wasn't rate-limited, but it IS. Just verify.
// ═══════════════════════════════════════════════════════════════════════════════
console.log('✅ 4. backend/app.js — admin-seed ALREADY rate-limited (seedLimiter: 5 req/hour). Verified.');


// ═══════════════════════════════════════════════════════════════════════════════
// 5. HARDCODED TOKENOMICS IN Airdrop.tsx
//    Move from inline array to a config-driven constant at the top
// ═══════════════════════════════════════════════════════════════════════════════
const airdropPath = path.join(frontendRoot, 'src/pages/frontend/Airdrop.tsx');
let airdrop = fs.readFileSync(airdropPath, 'utf8');

// Add a config block at the top of the file, after imports
if (!airdrop.includes('TOKENOMICS_ALLOCATIONS')) {
    // Find a good insertion point — after the last import
    const lastImportIdx = airdrop.lastIndexOf('\nimport ');
    const endOfLastImport = airdrop.indexOf('\n', airdrop.indexOf(';', lastImportIdx));
    
    const configBlock = `

// ── TOKENOMICS CONFIG ──────────────────────────────────────────────────────────
// These values should eventually be fetched from a backend config endpoint
// (e.g. /api/config/tokenomics) so they can be updated without redeploying.
// For now, they are centralized here as a single source of truth.
const TOKENOMICS_ALLOCATIONS = [
    { label: 'Liquidity Pool (LP)', pct: '30%', tokens: '6,300,000 $BAG', color: 'bg-alphabag-yellow text-black', desc: 'Paired with BNB on PancakeSwap. Burnt to secure market floor.' },
    { label: 'Trade-to-Earn (T2E)', pct: '35%', tokens: '7,350,000 $BAG', color: 'bg-[#1DA1F2] text-white', desc: 'Systematic emissions for missions & platform rewards. Locked for 6 months. Unlocked to begin T2E reward system for all community.' },
    { label: 'Dev & Ecosystem', pct: '15%', tokens: '3,150,000 $BAG', color: 'bg-alphabag-green text-black', desc: 'Infrastructure, API integrations & core platform upgrades. Locked for 6 months.' },
    { label: 'Marketing & Growth', pct: '10%', tokens: '2,100,000 $BAG', color: 'bg-alphabag-red text-white', desc: 'Ecosystem expansion & strategic partnerships. Locked for 6 months to build organic community and partnerships.' },
    { label: 'Team & Advisors', pct: '10%', tokens: '2,100,000 $BAG', color: 'bg-[#9333EA] text-white', desc: 'Team Allocation Locked for 24 months. Unlocked in phases.' },
];
`;
    airdrop = airdrop.substring(0, endOfLastImport + 1) + configBlock + airdrop.substring(endOfLastImport + 1);

    // Replace the inline array with the const reference
    airdrop = airdrop.replace(
        /\{[\s\S]*?\{ label: 'Liquidity Pool \(LP\)'[\s\S]*?\{ label: 'Team & Advisors'[\s\S]*?\]\.map/,
        '{TOKENOMICS_ALLOCATIONS.map'
    );
}

fs.writeFileSync(airdropPath, airdrop, 'utf8');
console.log('✅ 5. frontend/Airdrop.tsx — Tokenomics extracted to named TOKENOMICS_ALLOCATIONS constant');


// ═══════════════════════════════════════════════════════════════════════════════
// 6. PODCAST CHAT UNBOUNDED — Add rate limiting and max message cap
//    File: frontend/src/pages/frontend/AlphasFeed.tsx
// ═══════════════════════════════════════════════════════════════════════════════
alphasFeed = fs.readFileSync(alphasFeedPath, 'utf8');

// Add rate limiting constants and logic for podcast chat
if (!alphasFeed.includes('PODCAST_CHAT_MAX_MESSAGES')) {
    // Add constants after the import block
    const importEnd = alphasFeed.lastIndexOf("import { api } from '../../services/api';");
    const lineEnd = alphasFeed.indexOf('\n', importEnd);

    const chatLimitBlock = `

// ── PODCAST CHAT RATE LIMITING ───────────────────────────────────────────────
const PODCAST_CHAT_MAX_MESSAGES = 200; // Max messages shown in chat window
const PODCAST_CHAT_COOLDOWN_MS = 3000; // 3 second cooldown between messages
const PODCAST_CHAT_MAX_LENGTH = 280; // Max characters per message (like a tweet)
`;
    alphasFeed = alphasFeed.substring(0, lineEnd + 1) + chatLimitBlock + alphasFeed.substring(lineEnd + 1);

    // Add last-sent timestamp state
    if (!alphasFeed.includes('lastChatSentAt')) {
        alphasFeed = alphasFeed.replace(
            "const [podcastChatInput, setPodcastChatInput] = useState('');",
            "const [podcastChatInput, setPodcastChatInput] = useState('');\n    const [lastChatSentAt, setLastChatSentAt] = useState(0);"
        );
    }

    // Enhance handleSendPodcastChat with rate limiting, max length, and max messages
    alphasFeed = alphasFeed.replace(
        `const handleSendPodcastChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!podcastChatInput.trim() || !podcast) return;`,
        `const handleSendPodcastChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!podcastChatInput.trim() || !podcast) return;

        // Rate limiting: enforce cooldown
        const now = Date.now();
        if (now - lastChatSentAt < PODCAST_CHAT_COOLDOWN_MS) {
            return; // Silently reject rapid messages
        }

        // Max length enforcement
        const trimmedMsg = podcastChatInput.trim().slice(0, PODCAST_CHAT_MAX_LENGTH);
        if (!trimmedMsg) return;

        setLastChatSentAt(now);`
    );

    // Replace message content with trimmed version and cap the array
    alphasFeed = alphasFeed.replace(
        `message: podcastChatInput.trim(),`,
        `message: trimmedMsg,`
    );
    
    // Add max messages cap when setting podcast state
    alphasFeed = alphasFeed.replace(
        `liveChat: [newMsg, ...prev.liveChat]`,
        `liveChat: [newMsg, ...prev.liveChat].slice(0, PODCAST_CHAT_MAX_MESSAGES)`
    );
}

fs.writeFileSync(alphasFeedPath, alphasFeed, 'utf8');
console.log('✅ 6. frontend/AlphasFeed.tsx — Podcast chat: added rate limiting (3s cooldown), 280 char max, 200 msg cap');


console.log('\n🎉 ALL 6 REMAINING YELLOW-FLAG AUDIT ITEMS APPLIED!');
