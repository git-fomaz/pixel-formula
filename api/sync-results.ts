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

export default async function handler(req: any, res: any) {
  const secret = process.env.SYNC_SECRET;
  if (secret && req.headers['x-sync-secret'] !== secret) {
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

    const keyRound = `f1:${SEASON}:round:${payload.round}`;
    const keyLast = `f1:${SEASON}:last`;

    await redis.set(keyRound, JSON.stringify(payload));
    await redis.set(keyLast, JSON.stringify(payload));
    await redis.sAdd(`f1:${SEASON}:rounds`, payload.round);
    await redis.quit();

    return res.status(200).json({
      ok: true,
      stored: payload,
      keys: [keyRound, keyLast],
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Sync failed' });
  }
}
