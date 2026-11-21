import { createClient } from 'redis';

const SEASON = '2026';
const RACE_ID = 'las-vegas-2026-q';

const RESULTS = [
  'Kimi Antonelli',
  'Max Verstappen',
  'George Russell',
  'Lando Norris',
  'Isack Hadjar',
];

const POINTS = [15, 12, 10, 8, 8];
const BONUS = [0, 0, 2, 5, 10, 20];

const BASIC_CARDS = [
  '02_Charles_Leclerc_Basic',
  '05_Lando_Norris_Basic',
  '06_Isack_Hadjar_Basic',
  '07_Max_Verstappen_Basic',
  '09_Alex_Albon_Basic',
  '10_Fernando_Alonso_Basic',
  '11_Oliver_Bearman_Basic',
  '12_Valtteri_Bottas_Basic',
  '13_Rafael_Camara_Basic',
  '14_Franco_Colapinto_Basic',
  '15_Gabriel_Bortoleto_Basic',
  '16_Pierre_Gasly_Basic',
  '17_Kimi_Antonelli_Basic',
  '18_Lewis_Hamilton_Basic',
  '19_Sergio_Perez_Basic',
  '20_Oscar_Piastri_Basic',
  '21_George_Russell_Basic',
  '22_Carlos_Sainz_Basic',
  '23_Lance_Stroll_Basic',
  '24_Nico_Hulkenberg_Basic',
];

function pickRandom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function calculateScore(picks: string[], actual: string[]) {
  const positions = picks.map((driver, i) => ({
    matched: driver === actual[i],
    points: driver === actual[i] ? POINTS[i] * 0.5 : 0,
  }));
  const exactHits = positions.filter(x => x.matched).length;
  const basePoints = positions.reduce((s, x) => s + x.points, 0);
  const bonusPoints = BONUS[exactHits] * 0.5;
  return { totalPoints: basePoints + bonusPoints, exactHits };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const body = req.body || {};
  // cardsOnly=true: only award cards, do not touch scores
  const cardsOnly = body.cardsOnly === true;

  const redis = createClient({ url: process.env.REDIS_URL });
  try {
    await redis.connect();

    const userIds = await redis.sMembers(`pf:${SEASON}:users`);
    let scored = 0;
    let cardsAwarded = 0;

    if (!cardsOnly) {
      // Reset all totals to 0
      for (const userId of userIds) {
        await redis.set(`pf:${SEASON}:total:${userId}`, '0');
        await redis.del(`pf:${SEASON}:result:${userId}:${RACE_ID}`);
      }

      // Store results
      const payload = {
        season: SEASON,
        round: '21',
        raceName: 'Las Vegas Grand Prix Qualifying',
        date: '2026-11-21',
        results: RESULTS.map((name, i) => ({ position: i + 1, name })),
      };
      await redis.set(`pf:${SEASON}:results:${RACE_ID}`, JSON.stringify(payload));

      // Score once
      for (const userId of userIds) {
        const predRaw = await redis.get(`pf:${SEASON}:pred:${userId}:${RACE_ID}`);
        if (!predRaw) continue;

        let pred: any;
        try { pred = JSON.parse(predRaw); } catch { continue; }
        if (!Array.isArray(pred.picks) || pred.picks.length !== 5) continue;
        if (!pred.picks.every((p: string) => typeof p === 'string' && p.length > 2)) continue;

        const score = calculateScore(pred.picks, RESULTS);

        await redis.set(`pf:${SEASON}:result:${userId}:${RACE_ID}`, JSON.stringify({
          userId, raceId: RACE_ID, points: score.totalPoints, exact: score.exactHits,
          scoredAt: new Date().toISOString(),
        }));

        await redis.set(`pf:${SEASON}:total:${userId}`, String(score.totalPoints));
        scored++;
      }
    }

    // Award one random Basic card per user (idempotent)
    for (const userId of userIds) {
      const key = `pf:${SEASON}:bonus-card:${userId}`;
      const existing = await redis.get(key);
      if (existing) continue;

      const cardId = pickRandom(BASIC_CARDS);
      await redis.set(key, JSON.stringify({
        cardId,
        reason: 'За первый успешный прогноз на квалификацию',
        awardedAt: new Date().toISOString(),
      }));
      cardsAwarded++;
    }

    await redis.quit();
    return res.status(200).json({
      ok: true,
      scored,
      cardsAwarded,
      totalUsers: userIds.length,
      cardsOnly,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
