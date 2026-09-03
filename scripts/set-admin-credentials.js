import fs from 'fs';
import path from 'path';

console.log('=== SETTING ADMIN CREDENTIALS & PORTAL KEYS ===\n');

const adminEmail = 'admin@alphabagpro.com';
const adminPassword = 'AlphaBagPreview2026!';
const adminPortalKey = 'alphabag-admin-secret-portal-key-2026';

// 1. Update alphabag_v3_backend/.env
const backendEnvPath = 'C:/Users/1/repos/alphabag_v3_backend/.env';
let backendEnv = fs.existsSync(backendEnvPath) ? fs.readFileSync(backendEnvPath, 'utf8') : '';

const backendVars = {
    'ADMIN_PORTAL_KEY': adminPortalKey,
    'LOCAL_ADMIN_PREVIEW_EMAIL': adminEmail,
    'LOCAL_ADMIN_PREVIEW_PASSWORD': adminPassword,
    'PORT': '3003',
    'NODE_ENV': 'development',
    'JWT_SECRET': 'alphabag-dev-secret-key-32chars-min!!',
    'FRONTEND_URL': 'http://localhost:3005'
};

for (const [k, v] of Object.entries(backendVars)) {
    if (backendEnv.includes(`${k}=`)) {
        backendEnv = backendEnv.replace(new RegExp(`^${k}=.*$`, 'm'), `${k}=${v}`);
    } else {
        backendEnv += `\n${k}=${v}`;
    }
}

fs.writeFileSync(backendEnvPath, backendEnv.trim() + '\n', 'utf8');
console.log('✅ 1. alphabag_v3_backend/.env updated with admin credentials and portal key');

// 2. Update Alphabag_V3_Backend-UI/.env
const uiEnvPath = 'C:/Users/1/repos/Alphabag_V3_Backend-UI/.env';
let uiEnv = fs.existsSync(uiEnvPath) ? fs.readFileSync(uiEnvPath, 'utf8') : '';

const uiVars = {
    'VITE_ADMIN_PORTAL_KEY': adminPortalKey,
    'VITE_API_BASE_URL': 'http://localhost:3003'
};

for (const [k, v] of Object.entries(uiVars)) {
    if (uiEnv.includes(`${k}=`)) {
        uiEnv = uiEnv.replace(new RegExp(`^${k}=.*$`, 'm'), `${k}=${v}`);
    } else {
        uiEnv += `\n${k}=${v}`;
    }
}

fs.writeFileSync(uiEnvPath, uiEnv.trim() + '\n', 'utf8');
console.log('✅ 2. Alphabag_V3_Backend-UI/.env updated with VITE_ADMIN_PORTAL_KEY and VITE_API_BASE_URL');

// 3. Ensure authController.js in alphabag_v3_backend supports LOCAL_ADMIN_PREVIEW credentials
const authControllerPath = 'C:/Users/1/repos/alphabag_v3_backend/src/controllers/authController.js';
let authCtrl = fs.readFileSync(authControllerPath, 'utf8');

if (!authCtrl.includes('config.localAdminPreviewEmail')) {
    const previewCheckSnippet = `    // ── LOCAL ADMIN PREVIEW CREDENTIALS CHECK ────────────────────────────────
    if (
        config.localAdminPreviewEmail &&
        config.localAdminPreviewPassword &&
        email?.toLowerCase() === config.localAdminPreviewEmail.toLowerCase() &&
        password === config.localAdminPreviewPassword
    ) {
        const token = jwt.sign(
            { id: 'admin-preview', email: config.localAdminPreviewEmail, isAdmin: true },
            config.jwtSecret,
            { expiresIn: '24h' }
        );
        return res.json({
            token,
            user: {
                id: 'admin-preview',
                email: config.localAdminPreviewEmail,
                isAdmin: true,
                role: 'SUPER_ADMIN'
            }
        });
    }
`;

    authCtrl = authCtrl.replace(
        "const user = await store.findOne('admins', { email });",
        `${previewCheckSnippet}\n    const user = await store.findOne('admins', { email });`
    );

    fs.writeFileSync(authControllerPath, authCtrl, 'utf8');
    console.log('✅ 3. authController.js updated to support configured admin credentials');
}

console.log('\n🎉 ADMIN SETUP COMPLETE!');
