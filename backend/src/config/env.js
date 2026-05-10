
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
const rootPath = path.join(__dirname, '../../../');
dotenv.config({ path: path.join(rootPath, '.env') });
dotenv.config({ path: path.join(rootPath, '.env.local') });

export const config = {
    port: parseInt(process.env.PORT) || 3003,
    jwtSecret: process.env.JWT_SECRET || 'alphabag-secret-key-change-in-prod-urgent',
    adminEmail: 'admin@alphabagpro.com', // Primary Test Admin
    databaseUrl: process.env.DATABASE_URL,
    alchemyApiKey: process.env.ALCHEMY_API_KEY,
    apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.OPENAI_API_KEY || null
};
