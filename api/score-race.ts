import { createClient } from 'redis';

const SEASON = '2026';
const RACE_ID = 'las-vegas-2026';

const RESULTS = [
  'Lando Norris',
  'Max Verstappen',
  'Isack Hadjar',
  'George Russell',
  'Kimi Antonelli',
];

const POINTS = [15, 12, 10, 8, 8];
const BONUS = [0, 0, 2, 5, 10, 20];

function calculateScore(picks: string[], actual: string[]) {
  const positions = picks.map((driver, i) => ({
    matched: driver === actual[i],
    points: driver === actual[i] ? POINTS[i] : 0,
  }));
  const exactHits = positions.filter(x => x.matched).length;
  const basePoints = positions.reduce((s, x) => s + x.points, 0);
  const bonusPoints = BONUS[exactHits];
  return { totalPoints: basePoints + bonusPoints, exactHits };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const redis = createClient({ url: process.env.REDIS_URL });
  try {
    await redis.connect();

    // Full results payload for Reward page
    const fullResults = [
      { position: 1, name: 'Lando Norris' },
      { position: 2, name: 'Max Verstappen' },
      { position: 3, name: 'Isack Hadjar' },
      { position: 4, name: 'George Russell' },
      { position: 5, name: 'Kimi Antonelli' },
      { position: 6, name: 'Oscar Piastri' },
      { position: 7, name: 'Charles Leclerc' },
      { position: 8, name: 'Lewis Hamilton' },
      { position: 9, name: 'Fernando Alonso' },
      { position: 10, name: 'Carlos Sainz' },
    ];

    const payload = {
      season: SEASON,
      round: '21',
      raceName: 'Las Vegas Grand Prix',
      date: '2026-11-22',
      results: fullResults,
    };

    // Store under both key formats
    await redis.set(`pf:${SEASON}:results:${RACE_ID}`, JSON.stringify(payload));
    await redis.set(`f1:${SEASON}:round:21`, JSON.stringify(payload));
    await redis.set(`f1:${SEASON}:last`, JSON.stringify(payload));

    const userIds = await redis.sMembers(`pf:${SEASON}:users`);
    let scored = 0;

    for (const userId of userIds) {
      const alreadyKey = `pf:${SEASON}:result:${userId}:${RACE_ID}`;
      const predRaw = await redis.get(`pf:${SEASON}:pred:${userId}:${RACE_ID}`);
      if (!predRaw) continue;

      let pred: any;
      try { pred = JSON.parse(predRaw); } catch { continue; }
      if (!Array.isArray(pred.picks) || pred.picks.length !== 5) continue;

      const score = calculateScore(pred.picks, RESULTS);

      // Only add if not already scored (check if result exists with points)
      const existing = await redis.get(alreadyKey);
      if (existing) {
        // Already scored, skip to avoid double
        continue;
      }

      await redis.set(alreadyKey, JSON.stringify({
        userId, raceId: RACE_ID, points: score.totalPoints, exact: score.exactHits,
        scoredAt: new Date().toISOString(),
      }));

      const totalKey = `pf:${SEASON}:total:${userId}`;
      const prev = Number(await redis.get(totalKey) || 0);
      await redis.set(totalKey, String(prev + score.totalPoints));
      scored++;
    }

    await redis.quit();
    return res.status(200).json({ ok: true, scored, totalUsers: userIds.length, stored: true });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  } finally {
    await redis.quit().catch(() => {});
  }
}
