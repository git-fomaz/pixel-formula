import { createClient } from 'redis';

const SEASON = '2026';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, name } = req.body || {};
  if (!userId || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'userId and name required' });
  }

  const clean = name.trim().slice(0, 24);

  const redis = createClient({ url: process.env.REDIS_URL });
  try {
    await redis.connect();
    await redis.hSet(`pf:${SEASON}:names`, String(userId), clean);
    await redis.sAdd(`pf:${SEASON}:users`, String(userId));
    return res.status(200).json({ ok: true, name: clean });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed' });
  } finally {
    await redis.quit().catch(() => {});
  }
}
