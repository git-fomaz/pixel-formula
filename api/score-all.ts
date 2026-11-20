import { createClient } from 'redis';

const SEASON = '2026';

const POINTS = [15, 12, 10, 8, 8];
const BONUS = [0, 0, 2, 5, 10, 20];

function calculateScore(picks: string[], actual: string[], multiplier = 1) {
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

  const { raceId, secret } = req.body || {};
  if (!raceId || secret !== process.env.SCORE_SECRET) {
    return res.status(401).json({ error: 'unauthorized or missing raceId' });
  }

  const redis = createClient({ url: process.env.REDIS_URL });
  try {
    await redis.connect();

    // Official results
    const rawResults = await redis.get(`pf:${SEASON}:results:${raceId}`);
    if (!rawResults) {
      return res.status(404).json({ error: 'no results for this raceId' });
    }
    const results = JSON.parse(rawResults);
    const actual: string[] = (results.results || []).slice(0, 5).map((r: any) => r.name);
    if (actual.length !== 5) {
      return res.status(400).json({ error: 'results do not contain top 5' });
    }

    const userIds = await redis.sMembers(`pf:${SEASON}:users`);
    const isQual = raceId.endsWith('-q');
    const multiplier = isQual ? 0.5 : 1;

    let scored = 0;
    let skipped = 0;

    for (const userId of userIds) {
      const alreadyKey = `pf:${SEASON}:result:${userId}:${raceId}`;
      if (await redis.get(alreadyKey)) {
        skipped++;
        continue;
      }

      const predRaw = await redis.get(`pf:${SEASON}:pred:${userId}:${raceId}`);
      if (!predRaw) continue;

      let pred: any;
      try {
        pred = JSON.parse(predRaw);
      } catch {
        continue;
      }
      if (!Array.isArray(pred.picks) || pred.picks.length !== 5) continue;

      const score = calculateScore(pred.picks, actual, multiplier);

      await redis.set(
        alreadyKey,
        JSON.stringify({
          userId,
          raceId,
          points: score.totalPoints,
          exact: score.exactHits,
          scoredAt: new Date().toISOString(),
        })
      );

      const totalKey = `pf:${SEASON}:total:${userId}`;
      const prev = Number(await redis.get(totalKey) || 0);
      await redis.set(totalKey, String(prev + score.totalPoints));

      scored++;
    }

    return res.status(200).json({ ok: true, raceId, scored, skipped, totalUsers: userIds.length });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'internal error' });
  } finally {
    await redis.quit().catch(() => {});
  }
}
