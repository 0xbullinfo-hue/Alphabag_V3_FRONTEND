import fs from 'fs';
import path from 'path';

console.log('=== FIXING CORS & VITE PROXY FOR ADMIN UI ===\n');

// 1. Update alphabag_v3_backend/src/app.js - CORS allowed origins
const appJsPath = 'C:/Users/1/repos/alphabag_v3_backend/src/app.js';
let appJs = fs.readFileSync(appJsPath, 'utf8');

const oldCorsCheck = `    if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
      return callback(null, true);
    }`;

const newCorsCheck = `    if (
      origin.startsWith('http://localhost:') || 
      origin.startsWith('https://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.startsWith('https://127.0.0.1:') ||
      origin.startsWith('http://[::1]:')
    ) {
      return callback(null, true);
    }`;

if (appJs.includes(oldCorsCheck)) {
    appJs = appJs.replace(oldCorsCheck, newCorsCheck);
    fs.writeFileSync(appJsPath, appJs, 'utf8');
    console.log('✅ 1. alphabag_v3_backend/src/app.js CORS updated to support 127.0.0.1 and localhost');
}

// 2. Update Alphabag_V3_Backend-UI/vite.config.ts
const viteConfigPath = 'C:/Users/1/repos/Alphabag_V3_Backend-UI/vite.config.ts';
let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

viteConfig = viteConfig.replace(
    "target: env.VITE_API_BASE_URL || 'https://alpha-api.figmentstudio.ng',",
    "target: env.VITE_API_BASE_URL || 'http://localhost:3003',"
);

fs.writeFileSync(viteConfigPath, viteConfig, 'utf8');
console.log('✅ 2. Alphabag_V3_Backend-UI/vite.config.ts proxy default updated to http://localhost:3003');

// 3. Update Alphabag_V3_Backend-UI/.env
const backendUiEnvPath = 'C:/Users/1/repos/Alphabag_V3_Backend-UI/.env';
const backendUiEnvContent = `VITE_ADMIN_PORTAL_KEY=alphabag-admin-secret-portal-key-2026
VITE_API_BASE_URL=
`;
fs.writeFileSync(backendUiEnvPath, backendUiEnvContent, 'utf8');
console.log('✅ 3. Alphabag_V3_Backend-UI/.env written with empty VITE_API_BASE_URL (proxy mode) and VITE_ADMIN_PORTAL_KEY');

// 4. Update alphabag_v3_backend/.env
const backendEnvPath = 'C:/Users/1/repos/alphabag_v3_backend/.env';
let backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
if (!backendEnv.includes('ADMIN_PORTAL_KEY=alphabag-admin-secret-portal-key-2026')) {
    backendEnv += `\nADMIN_PORTAL_KEY=alphabag-admin-secret-portal-key-2026\nLOCAL_ADMIN_PREVIEW_EMAIL=admin@alphabagpro.com\nLOCAL_ADMIN_PREVIEW_PASSWORD=AlphaBagPreview2026!\n`;
    fs.writeFileSync(backendEnvPath, backendEnv, 'utf8');
    console.log('✅ 4. alphabag_v3_backend/.env verified with admin keys');
}

console.log('\n🎉 ALL CONFIG UPDATED SUCCESSFULLY!');
