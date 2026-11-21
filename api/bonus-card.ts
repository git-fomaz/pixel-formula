import { createClient } from 'redis';

const SEASON = '2026';

// Basic cards only for the bonus (exclude Legendary YOU)
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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const redis = createClient({ url: process.env.REDIS_URL });
  try {
    await redis.connect();

    if (req.method === 'POST') {
      // Award a random basic card to every user who doesn't have one yet
      const userIds = await redis.sMembers(`pf:${SEASON}:users`);
      let awarded = 0;

      for (const userId of userIds) {
        const key = `pf:${SEASON}:bonus-card:${userId}`;
        const existing = await redis.get(key);
        if (existing) continue;

        const cardId = pickRandom(BASIC_CARDS);
        await redis.set(
          key,
          JSON.stringify({
            cardId,
            reason: 'За первый успешный прогноз на квалификацию',
            awardedAt: new Date().toISOString(),
          })
        );
        awarded++;
      }

      return res.status(200).json({ ok: true, awarded, totalUsers: userIds.length });
    }

    // GET — fetch bonus card for one user
    const { userId } = req.query || {};
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const key = `pf:${SEASON}:bonus-card:${userId}`;
    const raw = await redis.get(key);
    if (!raw) return res.status(404).json({ error: 'No bonus card' });
    return res.status(200).json(JSON.parse(raw));
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed' });
  } finally {
    await redis.quit().catch(() => {});
  }
}
