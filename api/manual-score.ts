import { createClient } from 'redis';

const SEASON = '2026';
const RACE_ID = 'las-vegas-2026-q';

const RESULTS = [
  'Andrea Kimi Antonelli',
  'Max Verstappen',
  'George Russell',
  'Lando Norris',
  'Isack Hadjar',
];

const POINTS = [15, 12, 10, 8, 8];
const BONUS = [0, 0, 2, 5, 10, 20];

function calculateScore(picks: string[], actual: string[], multiplier = 0.5) {
  const positions = picks.map((driver, i) => ({
    matched: driver === actual[i],
    points: driver === actual[i] ? POINTS[i] * multiplier : 0,
  }));
  const exactHits = positions.filter(x => x.matched).length;
  const basePoints = positions.reduce((s, x) => s + x.points, 0);
  const bonusPoints = BONUS[exactHits] * multiplier;
  return { totalPoints: basePoints + bonusPoints, exactHits };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const redis = createClient({ url: process.env.REDIS_URL });
  try {
    await redis.connect();

    // Store results
    const payload = {
      season: SEASON,
      round: '21',
      raceName: 'Las Vegas Grand Prix Qualifying',
      date: '2026-11-21',
      results: RESULTS.map((name, i) => ({ position: i + 1, name })),
    };
    await redis.set(`pf:${SEASON}:results:${RACE_ID}`, JSON.stringify(payload));

    // Score all
    const userIds = await redis.sMembers(`pf:${SEASON}:users`);
    let scored = 0;

    for (const userId of userIds) {
      const alreadyKey = `pf:${SEASON}:result:${userId}:${RACE_ID}`;
      if (await redis.get(alreadyKey)) continue;

      const predRaw = await redis.get(`pf:${SEASON}:pred:${userId}:${RACE_ID}`);
      if (!predRaw) continue;

      let pred: any;
      try { pred = JSON.parse(predRaw); } catch { continue; }
      if (!Array.isArray(pred.picks) || pred.picks.length !== 5) continue;

      const score = calculateScore(pred.picks, RESULTS, 0.5);

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
    return res.status(200).json({ ok: true, scored, totalUsers: userIds.length });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
