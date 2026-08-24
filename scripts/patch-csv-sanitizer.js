import fs from 'fs';

const p = 'C:/Users/1/repos/alphabag_v3_backend/src/controllers/airdropController.js';
let code = fs.readFileSync(p, 'utf8');

const target = "...snapshot.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))";
const replacement = `...snapshot.map(row => headers.map(h => {
                let val = String(row[h] ?? '');
                // Sanitize CSV formula injection (prevent execution of =, +, -, @ formulas in spreadsheet software)
                if (/^[+=@-]/.test(val)) val = "'" + val;
                return JSON.stringify(val);
            }).join(','))`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync(p, code, 'utf8');
    console.log('✅ Successfully updated CSV formula sanitization in airdropController.js');
} else {
    console.log('Target string not found or already replaced');
}
