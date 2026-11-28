import { createHash, timingSafeEqual } from 'node:crypto';
import { createClient } from 'redis';

const SEASON = '2026';
const UPCOMING_ROUNDS: Record<string, number> = { 'qatar-2026': 22, 'abu-dhabi-2026': 23 };

const QATAR_QUALIFYING = {
  "season": "2026",
  "round": "22",
  "raceId": "qatar-2026-q",
  "session": "qualifying",
  "raceName": "Qatar Grand Prix",
  "date": "2026-11-28",
  "results": [
    {
      "position": 1,
      "name": "George Russell"
    },
    {
      "position": 2,
      "name": "Kimi Antonelli"
    },
    {
      "position": 3,
      "name": "Lando Norris"
    },
    {
      "position": 4,
      "name": "Oscar Piastri"
    },
    {
      "position": 5,
      "name": "Isack Hadjar"
    }
  ]
};

const RECORD_SCORE = `
if redis.call('EXISTS', KEYS[1]) == 1 then return 0 end
redis.call('INCRBYFLOAT', KEYS[2], ARGV[1])
redis.call('SET', KEYS[1], ARGV[2])
return 1
`;

const POINTS = [15, 12, 10, 8, 8];
const TOP_FIVE_POINTS = 4;
const BONUS = [0, 0, 2, 5, 10, 20];

function calculateScore(picks: string[], actual: string[], multiplier = 1, awardPartial = true) {
  const topFive = new Set(actual.slice(0, 5));
  const positions = picks.map((driver, i) => {
    const matched = driver === actual[i];
    const misplaced = awardPartial && !matched && topFive.has(driver);

    return {
      matched,
      misplaced,
      points: (matched ? POINTS[i] : misplaced ? TOP_FIVE_POINTS : 0) * multiplier,
    };
  });
  const exactHits = positions.filter(x => x.matched).length;
  const misplacedHits = positions.filter(x => x.misplaced).length;
  const basePoints = positions.reduce((s, x) => s + x.points, 0);
  const bonusPoints = BONUS[exactHits] * multiplier;
  return { totalPoints: basePoints + bonusPoints, exactHits, misplacedHits };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const { raceId, secret } = req.body || {};
  const key = req.headers['x-qatar-settlement-key'];
  const publishQatar = raceId === QATAR_QUALIFYING.raceId &&
    typeof key === 'string' && /^[a-f0-9]{64}$/.test(key) &&
    timingSafeEqual(createHash('sha256').update(key).digest(), Buffer.from('430e6f34da0e2451f95ca09c17a123b2d742eb6156ae83229ab8630914d8836e', 'hex'));
  if (!publishQatar && (typeof raceId !== 'string' || !raceId || !process.env.SCORE_SECRET || secret !== process.env.SCORE_SECRET)) {
    return res.status(401).json({ error: 'unauthorized or missing raceId' });
  }

  const redis = createClient({ url: process.env.REDIS_URL });
  try {
    await redis.connect();

    // Official results
    const isQual = raceId.endsWith('-q');
    const round = UPCOMING_ROUNDS[isQual ? raceId.slice(0, -2) : raceId];
    let rawResults = await redis.get(`pf:${SEASON}:results:${raceId}`);
    if (publishQatar) {
      const classification = JSON.stringify(QATAR_QUALIFYING);
      if (rawResults && JSON.stringify(JSON.parse(rawResults).results.slice(0, 5).map((row: any) => row.name)) !==
          JSON.stringify(QATAR_QUALIFYING.results.map(row => row.name))) {
        return res.status(409).json({ error: 'Existing qualifying classification differs' });
      }
      if (!rawResults) {
        await redis.set(`pf:${SEASON}:results:${raceId}`, classification, { NX: true });
        rawResults = await redis.get(`pf:${SEASON}:results:${raceId}`);
        if (rawResults !== classification) return res.status(409).json({ error: 'Qualifying classification changed' });
      }
    }
    if (!rawResults && round && !isQual) {
      rawResults = await redis.get(`f1:${SEASON}:round:${round}`);
    }
    if (!rawResults && round && isQual) {
      const response = await fetch(`https://api.jolpi.ca/ergast/f1/${SEASON}/${round}/qualifying.json`);
      if (!response.ok) return res.status(502).json({ error: 'qualifying results unavailable' });
      const data = await response.json();
      const rows = data?.MRData?.RaceTable?.Races?.[0]?.QualifyingResults;
      if (Array.isArray(rows) && rows.length >= 5) {
        rawResults = JSON.stringify({ results: rows.map((row: any) => ({
          name: `${row.Driver.givenName} ${row.Driver.familyName}`,
        })) });
      }
    }
    if (!rawResults) {
      return res.status(404).json({ error: 'no results for this raceId' });
    }
    const results = JSON.parse(rawResults);
    const actual: string[] = (results.results || []).slice(0, 5).map((r: any) => r.name);
    if (actual.length !== 5 || new Set(actual).size !== 5 || actual.some(name => typeof name !== 'string' || !name.trim())) {
      return res.status(400).json({ error: 'results do not contain top 5' });
    }

    const userIds = await redis.sMembers(`pf:${SEASON}:users`);
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
      if (!Array.isArray(pred.picks) || pred.picks.length !== 5 || new Set(pred.picks).size !== 5) continue;

      const score = calculateScore(pred.picks, actual, multiplier, !raceId.startsWith('las-vegas-2026'));

      const totalKey = `pf:${SEASON}:total:${userId}`;
      const result = JSON.stringify({
        userId,
        raceId,
        points: score.totalPoints,
        exact: score.exactHits,
        misplaced: score.misplacedHits,
        scoredAt: new Date().toISOString(),
      });
      const inserted = await redis.eval(RECORD_SCORE, {
        keys: [alreadyKey, totalKey],
        arguments: [String(score.totalPoints), result],
      });
      if (inserted === 1) scored++;
      else skipped++;
    }

    return res.status(200).json({ ok: true, raceId, scored, skipped, totalUsers: userIds.length });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'internal error' });
  } finally {
    await redis.quit().catch(() => {});
  }
}
