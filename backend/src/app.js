
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { store } from './services/storeService.js';
import { connectDB } from './utils/db.js';

// Connect to MongoDB if configured
connectDB();

// Routes
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import airdropRoutes from './routes/airdropRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import livePairRoutes from './routes/livePairRoutes.js';
import t2eRoutes from './routes/t2eRoutes.js';
import { marketRouter, whaleRouter, aiRouter, portfolioRouter } from './routes/serviceRoutes.js';
import { streamNeuralCore } from './controllers/aiController.js';

const app = express();

// Request Debugger (single instance)
app.use((req, res, next) => {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Initialize Store
store.init().catch(err => console.error('Store Init Failed:', err));

// Middleware
app.use(helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    contentSecurityPolicy: false,
}));
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

// Rate Limiting (Basic)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// App Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/airdrop', airdropRoutes);
app.use('/api', publicRoutes); // /api/news, /api/signals
app.use('/api/projects', projectRoutes);
app.use('/api/live-pairs', livePairRoutes);
app.use('/api/v1/t2e', t2eRoutes);

// Service Routes (Legacy Migration)
app.use('/api/portfolio', portfolioRouter); // Moved up to ensure precedence
app.use('/api/whale', whaleRouter); 
app.use('/api/ai', aiRouter);
app.use('/api', marketRouter);
// NOTE: publicRoutes already mounted above at /api — do NOT mount again here

app.post('/api/neural-core', streamNeuralCore);

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ONLINE', 
        port: config.port,
        timestamp: new Date().toISOString() 
    });
});

app.get('/api', (req, res) => {
    res.json({ message: 'AlphaBAG API Root', status: 'ACTIVE' });
});

app.get('/', (req, res) => {
    res.json({ message: 'AlphaBAG Infrastructure Active', version: '2.0.0' });
});

export default app;
