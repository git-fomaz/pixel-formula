import { createClient } from 'redis';

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';
const SEASON = '2026';

interface JolpicaResult {
  position: string;
  points: string;
  Driver: { driverId: string; givenName: string; familyName: string; code?: string };
  Constructor: { constructorId: string; name: string };
  status: string;
}

interface JolpicaRace {
  round: string;
  raceName: string;
  date: string;
  Results: JolpicaResult[];
}

async function fetchJolpicaResults(round?: string): Promise<JolpicaRace | null> {
  const path = round ? `${SEASON}/${round}/results.json` : `${SEASON}/last/results.json`;
  const url = `${JOLPICA_BASE}/${path}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'PixelFormula/1.0 (https://github.com/git-fomaz/pixel-formula)' },
  });

  if (!res.ok) {
    throw new Error(`Jolpica ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const race = data?.MRData?.RaceTable?.Races?.[0];
  return race || null;
}

function normalizeResults(race: JolpicaRace) {
  return {
    season: SEASON,
    round: race.round,
    raceName: race.raceName,
    date: race.date,
    syncedAt: new Date().toISOString(),
    results: race.Results.map((r) => ({
      position: Number(r.position),
      points: Number(r.points),
      driverId: r.Driver.driverId,
      name: `${r.Driver.givenName} ${r.Driver.familyName}`,
      code: r.Driver.code || null,
      constructor: r.Constructor.name,
      status: r.status,
    })),
  };
}

// Round number → our raceId
const ROUND_TO_RACE: Record<string, string> = {
  '21': 'las-vegas-2026',
  '22': 'qatar-2026',
  '23': 'abu-dhabi-2026',
};

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

async function scoreAllForRace(redis: any, raceId: string, actual: string[]) {
  const userIds = await redis.sMembers(`pf:${SEASON}:users`);
  const isQual = raceId.endsWith('-q');
  const multiplier = isQual ? 0.5 : 1;
  let scored = 0;

  for (const userId of userIds) {
    const alreadyKey = `pf:${SEASON}:result:${userId}:${raceId}`;
    if (await redis.get(alreadyKey)) continue;

    const predRaw = await redis.get(`pf:${SEASON}:pred:${userId}:${raceId}`);
    if (!predRaw) continue;

    let pred: any;
    try { pred = JSON.parse(predRaw); } catch { continue; }
    if (!Array.isArray(pred.picks) || pred.picks.length !== 5) continue;

    const score = calculateScore(pred.picks, actual, multiplier);

    await redis.set(alreadyKey, JSON.stringify({
      userId, raceId, points: score.totalPoints, exact: score.exactHits,
      scoredAt: new Date().toISOString(),
    }));

    const totalKey = `pf:${SEASON}:total:${userId}`;
    const prev = Number(await redis.get(totalKey) || 0);
    await redis.set(totalKey, String(prev + score.totalPoints));
    scored++;
  }
  return scored;
}

export default async function handler(req: any, res: any) {
  // Allow Vercel Cron (user-agent or x-vercel-cron-schedule header)
  // Also allow manual calls with SYNC_SECRET if set
  const isCron =
    req.headers['user-agent']?.includes('vercel-cron') ||
    !!req.headers['x-vercel-cron-schedule'];

  const secret = process.env.SYNC_SECRET;
  if (!isCron && secret && req.headers['x-sync-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const round = (req.query?.round as string) || undefined;

  try {
    const race = await fetchJolpicaResults(round);
    if (!race) {
      return res.status(404).json({ error: 'No race results found' });
    }

    const payload = normalizeResults(race);

    const redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();

    // Store by round and as "last"
    const keyRound = `f1:${SEASON}:round:${payload.round}`;
    const keyLast = `f1:${SEASON}:last`;

    await redis.set(keyRound, JSON.stringify(payload));
    await redis.set(keyLast, JSON.stringify(payload));
    await redis.sAdd(`f1:${SEASON}:rounds`, payload.round);

    // Auto-score if we know the raceId
    const raceId = ROUND_TO_RACE[payload.round];
    let scored = 0;
    if (raceId) {
      const actual = payload.results.slice(0, 5).map((r: any) => r.name);
      if (actual.length === 5) {
        await redis.set(`pf:${SEASON}:results:${raceId}`, JSON.stringify(payload));
        scored = await scoreAllForRace(redis, raceId, actual);
      }
    }

    await redis.quit();

    return res.status(200).json({
      ok: true,
      stored: payload,
      keys: [keyRound, keyLast],
      raceId: raceId || null,
      scored,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Sync failed' });
  }
}
