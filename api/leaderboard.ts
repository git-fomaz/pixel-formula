import { createClient } from 'redis';

const SEASON = '2026';

function getRedis() {
  return createClient({ url: process.env.REDIS_URL });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const redis = getRedis();
  try {
    await redis.connect();

    const userIds = await redis.sMembers(`pf:${SEASON}:users`);
    const names = await redis.hGetAll(`pf:${SEASON}:names`);

    const rows = await Promise.all(
      userIds.map(async (uid) => {
        const total = Number(await redis.get(`pf:${SEASON}:total:${uid}`) || 0);
        return {
          userId: uid,
          name: names[uid] || `User ${uid}`,
          points: total,
          exact: 0,
        };
      })
    );

    rows.sort((a, b) => b.points - a.points);
    const ranked = rows.map((r, i) => ({ ...r, pos: i + 1 }));

    return res.status(200).json({ season: SEASON, players: ranked });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed' });
  } finally {
    await redis.quit().catch(() => {});
  }
}
