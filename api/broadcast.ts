import { createClient } from 'redis';

const SEASON = '2026';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text, secret } = req.body || {};
  const expected = process.env.NOTIFY_SECRET || process.env.SCORE_SECRET;

  if (expected && secret !== expected) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!text || typeof text !== 'string' || text.length > 4000) {
    return res.status(400).json({ error: 'text required (max 4000 chars)' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN not set' });
  }

  const redis = createClient({ url: process.env.REDIS_URL });
  try {
    await redis.connect();
    const userIds = await redis.sMembers(`pf:${SEASON}:users`);

    let sent = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: userId, text }),
        });
        if (r.ok) sent++;
        else failed++;
      } catch {
        failed++;
      }
    }

    return res.status(200).json({ ok: true, sent, failed, total: userIds.length });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'broadcast failed' });
  } finally {
    await redis.quit().catch(() => {});
  }
}
