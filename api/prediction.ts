import { createClient } from 'redis';

const SEASON = '2026';

function getRedis() {
  return createClient({ url: process.env.REDIS_URL });
}

export default async function handler(req: any, res: any) {
  const redis = getRedis();
  try {
    await redis.connect();

    if (req.method === 'POST') {
      const { userId, raceId, picks, name } = req.body || {};
      if (!userId || !raceId || !Array.isArray(picks) || picks.length !== 5) {
        return res.status(400).json({ error: 'userId, raceId and picks[5] required' });
      }

      const key = `pf:${SEASON}:pred:${userId}:${raceId}`;
      const payload = {
        userId: String(userId),
        name: name || `User ${userId}`,
        raceId,
        picks,
        savedAt: new Date().toISOString(),
      };

      await redis.set(key, JSON.stringify(payload));
      // Index for leaderboard
      await redis.sAdd(`pf:${SEASON}:users`, String(userId));
      if (name) await redis.hSet(`pf:${SEASON}:names`, String(userId), name);

      return res.status(200).json({ ok: true, prediction: payload });
    }

    if (req.method === 'GET') {
      const { userId, raceId } = req.query || {};
      if (!userId || !raceId) {
        return res.status(400).json({ error: 'userId and raceId required' });
      }
      const key = `pf:${SEASON}:pred:${userId}:${raceId}`;
      const raw = await redis.get(key);
      if (!raw) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(JSON.parse(raw));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed' });
  } finally {
    await redis.quit().catch(() => {});
  }
}
