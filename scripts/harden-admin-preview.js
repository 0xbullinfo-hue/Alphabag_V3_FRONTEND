import fs from 'fs';

const authCtrlPath = 'C:/Users/1/repos/alphabag_v3_backend/src/controllers/authController.js';
let authCtrl = fs.readFileSync(authCtrlPath, 'utf8');

const targetSnippet = `    if (
        config.localAdminPreviewEmail &&
        config.localAdminPreviewPassword &&`;

const hardenedSnippet = `    if (
        !config.isProduction &&
        config.localAdminPreviewEmail &&
        config.localAdminPreviewPassword &&`;

if (authCtrl.includes(targetSnippet)) {
    authCtrl = authCtrl.replace(targetSnippet, hardenedSnippet);
    fs.writeFileSync(authCtrlPath, authCtrl, 'utf8');
    console.log('✅ Hardened localAdminPreview check with !config.isProduction guard');
} else {
    console.log('Target snippet not matched');
}
