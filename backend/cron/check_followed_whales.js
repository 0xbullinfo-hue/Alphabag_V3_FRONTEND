
import axios from 'axios';
import cron from 'node-cron';

// Runs every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('--- Scanning Whale Movement Nodes ---');

  try {
    // 1. Get all active follows from DB
    // const follows = await db.query('SELECT * FROM whale_follows');
    const follows = []; // Placeholder for DB logic

    for (const follow of follows) {
      // 2. Fetch flows via Nansen Token Flows API
      const response = await axios.get(`https://api.nansen.ai/v2/wallets/${follow.whale_address}/token-flows`, {
        headers: { 'api-key': process.env.NANSEN_API_KEY }
      });

      const recentTxs = response.data.flows;

      // 3. Filter by USD threshold and trigger alerts
      recentTxs.filter(tx => tx.usd_value > follow.threshold).forEach(tx => {
        console.log(`ALERT: Whale ${follow.whale_address} moved $${tx.usd_value} of ${tx.symbol}`);
        // Send Notification (WebSockets, Telegram, or Push)
      });
    }
  } catch (error) {
    console.error('Whale Scan Failure:', error.message);
  }
});
