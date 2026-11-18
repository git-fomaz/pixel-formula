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
      const { userId, raceId, points, exact, name } = req.body || {};
      if (!userId || !raceId || typeof points !== 'number') {
        return res.status(400).json({ error: 'userId, raceId and points required' });
      }

      const key = `pf:${SEASON}:result:${userId}:${raceId}`;
      const payload = {
        userId: String(userId),
        raceId,
        points,
        exact: exact || 0,
        scoredAt: new Date().toISOString(),
      };

      await redis.set(key, JSON.stringify(payload));
      // Update season total
      const totalKey = `pf:${SEASON}:total:${userId}`;
      const prev = Number(await redis.get(totalKey) || 0);
      await redis.set(totalKey, String(prev + points));

      await redis.sAdd(`pf:${SEASON}:users`, String(userId));
      if (name) await redis.hSet(`pf:${SEASON}:names`, String(userId), name);

      return res.status(200).json({ ok: true, result: payload });
    }

    if (req.method === 'GET') {
      const { userId, raceId } = req.query || {};
      if (!userId) return res.status(400).json({ error: 'userId required' });

      if (raceId) {
        const key = `pf:${SEASON}:result:${userId}:${raceId}`;
        const raw = await redis.get(key);
        if (!raw) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(JSON.parse(raw));
      }

      // Season total
      const total = Number(await redis.get(`pf:${SEASON}:total:${userId}`) || 0);
      return res.status(200).json({ userId, total });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed' });
  } finally {
    await redis.quit().catch(() => {});
  }
}
