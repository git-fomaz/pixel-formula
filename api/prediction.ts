import { createClient } from 'redis';

const SEASON = '2026';
type PredictionMode = 'race' | 'qualifying';

// Vercel runs this endpoint as a standalone Node function. Keep its schedule
// self-contained (in sync with src/lib/predictionSchedule.ts) so the runtime
// does not need to resolve a TypeScript module outside api/.
const PREDICTION_RACES = [
  {
    id: 'qatar-2026', name: 'Гран-при Катара', circuit: 'Lusail International Circuit',
    weekend: '27–29 ноября 2026', round: 22, unlockAfterRound: 21,
    qualifyingDeadline: '2026-11-28T18:00:00Z', raceDeadline: '2026-11-29T16:00:00Z',
    banner: '/qatar-banner.webp',
  },
  {
    id: 'abu-dhabi-2026', name: 'Гран-при Абу-Даби', circuit: 'Yas Marina Circuit',
    weekend: '4–6 декабря 2026', round: 23, unlockAfterRound: 22,
    qualifyingDeadline: '2026-12-05T14:00:00Z', raceDeadline: '2026-12-06T13:00:00Z',
    banner: null,
  },
];

const PREDICTION_DRIVERS = new Set([
  'Lando Norris', 'Oscar Piastri', 'George Russell', 'Kimi Antonelli',
  'Max Verstappen', 'Isack Hadjar', 'Charles Leclerc', 'Lewis Hamilton',
  'Alex Albon', 'Carlos Sainz', 'Liam Lawson', 'Arvid Lindblad',
  'Fernando Alonso', 'Lance Stroll', 'Pierre Gasly', 'Franco Colapinto',
  'Rafael Camara', 'Oliver Bearman', 'Nico Hulkenberg', 'Gabriel Bortoleto',
  'Valtteri Bottas', 'Sergio Perez',
]);

type PredictionRace = typeof PREDICTION_RACES[number];

function getAvailablePredictionRace(publishedRound: number): PredictionRace | null {
  return PREDICTION_RACES.find((race) => race.unlockAfterRound === publishedRound) ?? null;
}

function predictionRaceId(race: PredictionRace, mode: PredictionMode): string {
  return mode === 'qualifying' ? `${race.id}-q` : race.id;
}

function isPredictionOpen(race: PredictionRace, mode: PredictionMode, now: number): boolean {
  const deadline = mode === 'qualifying' ? race.qualifyingDeadline : race.raceDeadline;
  return now < Date.parse(deadline);
}

function getRedis() {
  return createClient({ url: process.env.REDIS_URL });
}

async function getCurrentRace(redis: ReturnType<typeof getRedis>) {
  const raw = await redis.get(`f1:${SEASON}:last`);
  if (!raw) return null;

  const latest = JSON.parse(raw);
  // A race unlocks only after its predecessor's classified results exist.
  if (!Array.isArray(latest.results) || latest.results.length < 5) return null;
  return getAvailablePredictionRace(Number(latest.round));
}

export default async function handler(req: any, res: any) {
  const redis = getRedis();
  try {
    await redis.connect();

    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'GET' && req.query?.status === 'current') {
      return res.status(200).json({ race: await getCurrentRace(redis) });
    }

    if (req.method === 'POST') {
      const { userId, raceId, picks, name } = req.body || {};
      if (!userId || !raceId || !Array.isArray(picks) || picks.length !== 5) {
        return res.status(400).json({ error: 'userId, raceId and picks[5] required' });
      }

      const race = await getCurrentRace(redis);
      const mode: PredictionMode | null = raceId === race?.id
        ? 'race'
        : race && raceId === predictionRaceId(race, 'qualifying') ? 'qualifying' : null;

      if (!race || !mode) {
        return res.status(403).json({ error: 'Приём прогнозов на этот этап не открыт' });
      }
      if (!isPredictionOpen(race, mode, Date.now())) {
        return res.status(403).json({ error: 'Приём прогнозов на этот этап завершён' });
      }
      if (new Set(picks).size !== 5 || !picks.every((p) =>
        typeof p === 'string' && PREDICTION_DRIVERS.has(p)
      )) {
        return res.status(400).json({ error: 'Выбери пять разных пилотов' });
      }

      const key = `pf:${SEASON}:pred:${userId}:${raceId}`;
      const payload = {
        userId: String(userId),
        name: name || `User ${userId}`,
        raceId,
        picks,
        savedAt: new Date().toISOString(),
      };

      await redis.set(key, JSON.stringify(payload));
      // Index for leaderboard
      await redis.sAdd(`pf:${SEASON}:users`, String(userId));
      if (name) await redis.hSet(`pf:${SEASON}:names`, String(userId), name);

      return res.status(200).json({ ok: true, prediction: payload });
    }

    if (req.method === 'GET') {
      const { userId, raceId } = req.query || {};
      if (!userId || !raceId) {
        return res.status(400).json({ error: 'userId and raceId required' });
      }
      const key = `pf:${SEASON}:pred:${userId}:${raceId}`;
      const raw = await redis.get(key);
      if (!raw) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(JSON.parse(raw));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed' });
  } finally {
    await redis.quit().catch(() => {});
  }
}
