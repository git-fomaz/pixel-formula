import { createClient } from 'redis';

const SEASON = '2026';

export default async function handler(req: any, res: any) {
  const round = (req.query?.round as string) || 'last';

  try {
    const redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();

    const key = round === '22-q' ? `pf:${SEASON}:results:qatar-2026-q` :
      round === 'last' ? `f1:${SEASON}:last` : `f1:${SEASON}:round:${round}`;
    const raw = await redis.get(key);
    await redis.quit();

    if (!raw) {
      return res.status(404).json({ error: 'Results not found. Run /api/sync-results first.' });
    }

    return res.status(200).json(JSON.parse(raw));
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to read results' });
  }
}
