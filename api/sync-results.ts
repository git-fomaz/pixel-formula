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

const ROUND_TO_RACE: Record<string, string> = {
  '21': 'las-vegas-2026',
  '22': 'qatar-2026',
  '23': 'abu-dhabi-2026',
};

export default async function handler(req: any, res: any) {
  const isCron =
    req.headers['user-agent']?.includes('vercel-cron') ||
    !!req.headers['x-vercel-cron-schedule'];

  const secret = process.env.SYNC_SECRET;
  if (!isCron && secret && req.headers['x-sync-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const redis = createClient({ url: process.env.REDIS_URL });
  try {
    await redis.connect();

    // Manual injection via POST body
    if (req.method === 'POST' && req.body?.results) {
      const { round = '21', raceName = 'Las Vegas Grand Prix', date = '2026-11-22', results } = req.body;
      const payload = {
        season: SEASON,
        round: String(round),
        raceName,
        date,
        syncedAt: new Date().toISOString(),
        results,
      };

      await redis.set(`f1:${SEASON}:round:${payload.round}`, JSON.stringify(payload));
      await redis.set(`f1:${SEASON}:last`, JSON.stringify(payload));
      await redis.sAdd(`f1:${SEASON}:rounds`, payload.round);

      const raceId = ROUND_TO_RACE[payload.round];
      if (raceId) {
        await redis.set(`pf:${SEASON}:results:${raceId}`, JSON.stringify(payload));
      }

      await redis.quit();
      return res.status(200).json({ ok: true, stored: payload, raceId: raceId || null });
    }

    // Normal Jolpica sync
    const round = (req.query?.round as string) || undefined;
    const race = await fetchJolpicaResults(round);
    if (!race) {
      await redis.quit();
      return res.status(404).json({ error: 'No race results found' });
    }

    const payload = normalizeResults(race);
    await redis.set(`f1:${SEASON}:round:${payload.round}`, JSON.stringify(payload));
    await redis.set(`f1:${SEASON}:last`, JSON.stringify(payload));
    await redis.sAdd(`f1:${SEASON}:rounds`, payload.round);

    await redis.quit();
    return res.status(200).json({ ok: true, stored: payload });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Sync failed' });
  } finally {
    await redis.quit().catch(() => {});
  }
}
