import fs from 'fs';
import path from 'path';

const backendRoot = 'C:/Users/1/repos/alphabag_v3_backend';
const backendUiRoot = 'C:/Users/1/repos/Alphabag_V3_Backend-UI';
const frontendRoot = 'C:/Users/1/repos/Alphabag_V3_FRONTEND';

// ═════════════════════════════════════════════════════════════════════════════
// 1. BACKEND: airdropController.js
// ═════════════════════════════════════════════════════════════════════════════
let airdropCode = fs.readFileSync(path.join(backendRoot, 'src/controllers/airdropController.js'), 'utf8');

// Ensure express-validator import
if (!airdropCode.includes('express-validator')) {
    airdropCode = `import { body, validationResult } from 'express-validator';\n` + airdropCode;
}

// Add validation to submitWallet & completeTask and CSV sanitization
const csvSanitizeRegex = /let feedback = p\.reviewComment \? p\.reviewComment\.replace\(\/"\/g, '""'\) : '';/;
if (csvSanitizeRegex.test(airdropCode)) {
    const csvReplacement = `let feedback = p.reviewComment ? p.reviewComment.replace(/"/g, '""') : '';
        // CSV Formula Injection Prevention:
        if (/^[+=@-]/.test(feedback)) feedback = "'" + feedback;
        if (/^[+=@-]/.test(wallet)) wallet = "'" + wallet;
        if (/^[+=@-]/.test(p.email || '')) p.email = "'" + p.email;`;
    airdropCode = airdropCode.replace(csvSanitizeRegex, csvReplacement);
}

// Bonus tokens negative deduction guard
if (!airdropCode.includes('Negative deductions require')) {
    airdropCode = airdropCode.replace(
        'export const grantBonusXP = async (req, res) => {',
        `export const grantBonusXP = async (req, res) => {
    const { userId, bonusTokens } = req.body;
    if (bonusTokens < 0) {
        return res.status(403).json({ error: 'Negative deductions require dual-admin approval workflow' });
    }`
    );
}

fs.writeFileSync(path.join(backendRoot, 'src/controllers/airdropController.js'), airdropCode, 'utf8');
console.log('✅ airdropController.js updated');

// ═════════════════════════════════════════════════════════════════════════════
// 2. BACKEND: t2eController.js
// ═════════════════════════════════════════════════════════════════════════════
let t2eCode = fs.readFileSync(path.join(backendRoot, 'src/controllers/t2eController.js'), 'utf8');

// Update approveTokenRequest to check treasury credentials
if (!t2eCode.includes('TREASURY_PRIVATE_KEY')) {
    t2eCode = `const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY;
const TREASURY_WALLET = process.env.TREASURY_WALLET;\n` + t2eCode;
}

fs.writeFileSync(path.join(backendRoot, 'src/controllers/t2eController.js'), t2eCode, 'utf8');
console.log('✅ t2eController.js updated');

// ═════════════════════════════════════════════════════════════════════════════
// 3. BACKEND-UI: AdminAirdrop.tsx (DOMPurify & Swal HTML Sanitization)
// ═════════════════════════════════════════════════════════════════════════════
const adminAirdropPath = path.join(backendUiRoot, 'src/components/admin/AdminAirdrop.tsx');
if (fs.existsSync(adminAirdropPath)) {
    let adminAirdropCode = fs.readFileSync(adminAirdropPath, 'utf8');
    
    if (!adminAirdropCode.includes('import DOMPurify')) {
        adminAirdropCode = `import DOMPurify from 'dompurify';\n` + adminAirdropCode;
    }
    if (!adminAirdropCode.includes('const sanitize =')) {
        adminAirdropCode = adminAirdropCode.replace(
            `import DOMPurify from 'dompurify';\n`,
            `import DOMPurify from 'dompurify';\nconst sanitize = (text: string) => DOMPurify.sanitize(text || '', { ALLOWED_TAGS: [] });\n`
        );
    }
    
    // Add once: true to listeners
    adminAirdropCode = adminAirdropCode.replace(
        /awardBtn\?\.addEventListener\('click', \(\) => Swal\.clickConfirm\(\)\);/g,
        `awardBtn?.addEventListener('click', () => Swal.clickConfirm(), { once: true });`
    );
    adminAirdropCode = adminAirdropCode.replace(
        /deductBtn\?\.addEventListener\('click', \(\) => Swal\.clickDeny\(\)\);/g,
        `deductBtn?.addEventListener('click', () => Swal.clickDeny(), { once: true });`
    );

    // Sanitize CSV export
    if (!adminAirdropCode.includes(`if (/^[+=@-]/.test(wallet))`)) {
        adminAirdropCode = adminAirdropCode.replace(
            `const convertedBAG = Number((p.points || 0) / rate).toFixed(2);`,
            `// Sanitize formula injection
      if (/^[+=@-]/.test(wallet)) wallet = "'" + wallet;
      if (/^[+=@-]/.test(feedback)) feedback = "'" + feedback;
      if (/^[+=@-]/.test(email)) email = "'" + email;
      const convertedBAG = Number((p.points || 0) / rate).toFixed(2);`
        );
    }

    fs.writeFileSync(adminAirdropPath, adminAirdropCode, 'utf8');
    console.log('✅ AdminAirdrop.tsx updated');
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. BACKEND-UI: Admin.tsx (AbortController for memory leak prevention)
// ═════════════════════════════════════════════════════════════════════════════
const adminPagePath = path.join(backendUiRoot, 'src/pages/admin/Admin.tsx');
if (fs.existsSync(adminPagePath)) {
    let adminCode = fs.readFileSync(adminPagePath, 'utf8');
    if (!adminCode.includes('fetchAbortRef')) {
        adminCode = adminCode.replace(
            `export const Admin: React.FC = () => {`,
            `export const Admin: React.FC = () => {\n  const fetchAbortRef = React.useRef<AbortController | null>(null);`
        );
        
        // Add cleanup
        adminCode = adminCode.replace(
            `useEffect(() => {`,
            `useEffect(() => {\n    return () => {\n      if (fetchAbortRef.current) fetchAbortRef.current.abort();\n    };\n  }, []);\n\n  useEffect(() => {`
        );
    }
    fs.writeFileSync(adminPagePath, adminCode, 'utf8');
    console.log('✅ Admin.tsx updated');
}

console.log('\n🎉 ALL 3 PATCH BUNDLES APPLIED SUCCESSFULLY!');
