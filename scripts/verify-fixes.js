const fs = require('fs');
console.log('=== VERIFICATION ===\n');

const auth = fs.readFileSync('C:/Users/1/repos/alphabag_v3_backend/src/controllers/authController.js', 'utf8');
console.log('1. Self-referral block:', auth.includes('Self-referral blocked') ? 'PRESENT' : 'MISSING');

const feed = fs.readFileSync('C:/Users/1/repos/Alphabag_V3_FRONTEND/src/pages/frontend/AlphasFeed.tsx', 'utf8');
console.log('2a. DOMPurify in AlphasFeed:', feed.includes('DOMPurify') ? 'PRESENT' : 'MISSING');

const passes = fs.readFileSync('C:/Users/1/repos/Alphabag_V3_FRONTEND/src/pages/frontend/AlphaPasses.tsx', 'utf8');
console.log('2b. DOMPurify in AlphaPasses:', passes.includes('DOMPurify') ? 'PRESENT' : 'MISSING');

const t2e = fs.readFileSync('C:/Users/1/repos/alphabag_v3_backend/src/controllers/t2eController.js', 'utf8');
console.log('3. claimLock TTL:', t2e.includes('LOCK_TTL_MS') ? 'PRESENT' : 'MISSING');

const app = fs.readFileSync('C:/Users/1/repos/alphabag_v3_backend/src/app.js', 'utf8');
console.log('4. seedLimiter:', app.includes('seedLimiter') ? 'PRESENT' : 'MISSING');

const airdrop = fs.readFileSync('C:/Users/1/repos/Alphabag_V3_FRONTEND/src/pages/frontend/Airdrop.tsx', 'utf8');
console.log('5. TOKENOMICS_ALLOCATIONS:', airdrop.includes('TOKENOMICS_ALLOCATIONS') ? 'PRESENT' : 'MISSING');

console.log('6a. Chat cooldown:', feed.includes('PODCAST_CHAT_COOLDOWN_MS') ? 'PRESENT' : 'MISSING');
console.log('6b. Chat max length:', feed.includes('PODCAST_CHAT_MAX_LENGTH') ? 'PRESENT' : 'MISSING');
console.log('6c. Chat max messages:', feed.includes('PODCAST_CHAT_MAX_MESSAGES') ? 'PRESENT' : 'MISSING');
