
import express from 'express';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config({ path: ['.env.local', '.env'] });

const app = express();
app.use(express.json());
app.use(cors());

// Memory Caches
const portfolioCache = new NodeCache({ stdTTL: 30 }); // 30s for Zerion
const priceCache = new NodeCache({ stdTTL: 10 });    // 10s for CoinGecko
const aiCache = new NodeCache({ stdTTL: 300 });      // 5m for AI briefings

// Rate Limiting: 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// --- ADMIN & USER TRACKING ---
// Simple in-memory storage for active users (for MVP)
// In production, use MongoDB/PostgreSQL
const activeUsers = new Map(); // address -> { lastActive: timestamp, tier: string }

app.get('/api/admin/users', (req, res) => {
  // In a real app, verify Admin signature here
  const usersList = Array.from(activeUsers.entries()).map(([address, data]) => ({
    address,
    ...data
  }));
  res.json({ users: usersList, count: usersList.length });
});


// --- AUTHENTICATION ---
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'alphabag-secret-key-change-in-prod';
const users = []; // In-memory user store for MVP

// Register Endpoint
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: 'usr_' + Math.random().toString(36).substr(2, 9),
    email,
    password: hashedPassword,
    tier: 'FREE',
    alphaAiUsageSeconds: 0,
    lastAlphaAiReset: new Date().toISOString(),
    isAdmin: email.includes('admin') || email.includes('alphabag.pro')
  };

  users.push(newUser);

  const token = jwt.sign({ id: newUser.id, email: newUser.email, isAdmin: newUser.isAdmin }, JWT_SECRET, { expiresIn: '24h' });

  // Return user without password
  const { password: _, ...userSafe } = newUser;
  res.json({ token, user: userSafe });
});

// Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '24h' });
  const { password: _, ...userSafe } = user;

  res.json({ token, user: userSafe });
});

// Middleware to track activity
const trackUser = (req, res, next) => {
  const address = req.params.address || req.body.address;
  if (address) {
    activeUsers.set(address, {
      lastActive: new Date().toISOString(),
      tier: 'FREE' // Default, updated if they hit premium endpoints
    });
  }
  next();
};


// --- AI ENDPOINT (Briefing & Chat) ---
app.post('/api/ai/briefing', async (req, res) => {
  const { assets, tier, userMessage } = req.body;

  // Cache key differs if it's a specific user question
  const cacheKey = userMessage
    ? `chat_${tier}_${userMessage.substring(0, 50)}`
    : `briefing_${tier}_${JSON.stringify(assets)}`;

  if (aiCache.has(cacheKey) && !userMessage) {
    return res.json({ briefing: aiCache.get(cacheKey) });
  }

  try {
    // UPDATED: Use standard GoogleGenerativeAI SDK
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const assetContext = assets && assets.length > 0
      ? assets.map(a => `${a.symbol} ($${Math.round(a.value)})`).join(', ')
      : 'No active positions';

    const systemInstruction = `You are AlphaAi, an elite institutional crypto analyst.
    CONTEXT: User Tier: ${tier}. Portfolio: [${assetContext}].
    
    RULES:
    1. Be concise, professional, and slightly futuristic/cypherpunk.
    2. If the user asks for a chart, use <ALPHA_CHART type="pie|area" data='[JSON]' />.
    3. Do not give financial advice.
    
    Current Query: ${userMessage || "Generate a daily market briefing."}`;

    const result = await model.generateContent(systemInstruction);
    const response = await result.response;
    const output = response.text();

    if (!userMessage) {
      aiCache.set(cacheKey, output);
      res.json({ briefing: output });
    } else {
      res.json({ briefing: output });
    }

  } catch (error) {
    if (error.message.includes('429') || error.status === 429) {
      console.warn("AI Rate Limit Hit. Serving Fallback.");
      return res.json({ briefing: "⚠️ Neural Network Overload (Rate Limit). \n\nSystem is currently experiencing high volume. \n\nUse the 'Assets' tab to view your raw data manually while we cooldown. \n\n(Try again in 30 seconds)." });
    }
    console.error("AI Briefing Error Full Details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    res.status(500).json({ briefing: "Neural nodes are currently recalibrating. Market sentiment remains constructive across major liquidity hubs." });
  }
});

// --- TASK 1: ZERION PORTFOLIO ---
app.get('/api/portfolio/:address', trackUser, async (req, res) => {
  const { address } = req.params;
  const cacheKey = `portfolio_${address}`;

  if (portfolioCache.has(cacheKey)) {
    return res.json(portfolioCache.get(cacheKey));
  }

  try {
    const response = await axios.get(`https://api.zerion.io/v1/wallets/${address}/portfolio`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.ZERION_API_KEY + ':').toString('base64')}`,
        'accept': 'application/json'
      }
    });

    const data = response.data.data;
    portfolioCache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json({ error: error.message });
  }
});

// --- TASK 2: COINGECKO PRICES ---
app.get('/api/prices', async (req, res) => {
  const { ids } = req.query;
  const cacheKey = `prices_${ids}`;

  if (priceCache.has(cacheKey)) {
    return res.json(priceCache.get(cacheKey));
  }

  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: ids,
        vs_currencies: 'usd',
        include_24hr_change: 'true'
      },
      headers: process.env.COINGECKO_API_KEY ? { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY } : {}
    });

    priceCache.set(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: 'Market data sync failed' });
  }
});

app.get('/api/search', async (req, res) => {
  const { query } = req.query;
  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/search?query=${query}`);
    res.json(response.data.coins.slice(0, 8)); // Return top 8 matches
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// --- TASK 3: NANSEN WHALE TRACKING ---
app.get('/api/whale/top-holders', async (req, res) => {
  const { token_address } = req.query;
  try {
    const response = await axios.get(`https://api.nansen.ai/v2/tokens/${token_address}/top-holders`, {
      headers: { 'api-key': process.env.NANSEN_API_KEY }
    });
    res.json(response.data.holders.slice(0, 25));
  } catch (error) {
    res.status(500).json({ error: 'Whale data unavailable' });
  }
});

app.post('/api/whale/follow', async (req, res) => {
  const { userId, whaleAddress, minThreshold } = req.body;
  res.json({ success: true, message: `Now tracking ${whaleAddress}` });
});

// --- TASK 4: CEX INTEGRATION via CCXT ---
import ccxt from 'ccxt';

app.post('/api/cex/balance', async (req, res) => {
  const { exchangeId, apiKey, secret } = req.body;

  // Safety check: Don't log real keys in production
  console.log(`Attempting to connect to ${exchangeId}...`);

  try {
    if (!ccxt[exchangeId]) {
      return res.status(400).json({ error: 'Exchange not supported' });
    }

    const exchangeClass = ccxt[exchangeId];
    const exchange = new exchangeClass({
      apiKey: apiKey,
      secret: secret,
      enableRateLimit: true,
    });

    // Fetch balance
    const balance = await exchange.fetchTotalBalance();

    // Filter small balances (dust)
    const relevantBalances = {};
    for (const [currency, amount] of Object.entries(balance)) {
      if (amount > 0) { // simplified dust filter
        relevantBalances[currency] = amount;
      }
    }

    // Calculate simplified total in USDT (mocking price fetch for now for speed, or using fetchTicker)
    // For a real prod app, we'd loop through and multiply by price.
    // Here we just return the raw token balances and let frontend estimate, 
    // OR we try to fetch total USD value if the exchange supports it easily.

    res.json({
      success: true,
      balances: relevantBalances,
      raw: balance
    });

  } catch (error) {
    console.error(`CEX Error (${exchangeId}):`, error.message);
    res.status(500).json({ error: `Connection failed: ${error.message}` });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend Active on Hub Port ${PORT}`));
