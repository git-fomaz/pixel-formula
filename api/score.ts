import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { createClient } from 'redis';

const SEASON = '2026';

function getRedis() {
  return createClient({ url: process.env.REDIS_URL });
}

export default async function handler(req: any, res: any) {
  if (req.query?.wallet === 'test-grant') return grantTestToken(req, res);
  if (req.query?.wallet === 'cards') return handleCardTokens(req, res);

  if (req.method === 'POST' && (!process.env.SCORE_SECRET || req.body?.secret !== process.env.SCORE_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const redis = getRedis();
  try {
    await redis.connect();

    if (req.method === 'POST') {
      const { userId, raceId, points, exact, name } = req.body || {};
      if (!userId || !raceId || typeof points !== 'number') {
        return res.status(400).json({ error: 'userId, raceId and points required' });
      }

      const key = `pf:${SEASON}:result:${userId}:${raceId}`;
      const payload = {
        userId: String(userId),
        raceId,
        points,
        exact: exact || 0,
        scoredAt: new Date().toISOString(),
      };

      await redis.set(key, JSON.stringify(payload));
      // Update season total
      const totalKey = `pf:${SEASON}:total:${userId}`;
      const prev = Number(await redis.get(totalKey) || 0);
      await redis.set(totalKey, String(prev + points));

      await redis.sAdd(`pf:${SEASON}:users`, String(userId));
      if (name) await redis.hSet(`pf:${SEASON}:names`, String(userId), name);

      return res.status(200).json({ ok: true, result: payload });
    }

    if (req.method === 'GET') {
      const { userId, raceId } = req.query || {};
      if (!userId) return res.status(400).json({ error: 'userId required' });

      if (raceId) {
        const key = `pf:${SEASON}:result:${userId}:${raceId}`;
        const raw = await redis.get(key);
        if (!raw) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(JSON.parse(raw));
      }

      // Season total
      const total = Number(await redis.get(`pf:${SEASON}:total:${userId}`) || 0);
      return res.status(200).json({ userId, total });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed' });
  } finally {
    await redis.quit().catch(() => {});
  }
}

const POINTS_PER_TOKEN = 20;
const POOLS = {
  "Rare": [
    "01_Charles_Leclerc_Rare",
    "04_Liam_Lawson_Rare",
    "27_Lando_Norris_Rare_USA",
    "28_Oscar_Piastri_Rare_USA",
    "29_Kimi_Antonelli_Rare_USA",
    "30_Pierre_Gasly_Rare_USA"
  ],
  "Basic": [
    "02_Charles_Leclerc_Basic",
    "05_Lando_Norris_Basic",
    "06_Isack_Hadjar_Basic",
    "07_Max_Verstappen_Basic",
    "09_Alex_Albon_Basic",
    "10_Fernando_Alonso_Basic",
    "11_Oliver_Bearman_Basic",
    "12_Valtteri_Bottas_Basic",
    "13_Rafael_Camara_Basic",
    "14_Franco_Colapinto_Basic",
    "15_Gabriel_Bortoleto_Basic",
    "16_Pierre_Gasly_Basic",
    "17_Kimi_Antonelli_Basic",
    "18_Lewis_Hamilton_Basic",
    "19_Sergio_Perez_Basic",
    "20_Oscar_Piastri_Basic",
    "21_George_Russell_Basic",
    "22_Carlos_Sainz_Basic",
    "23_Lance_Stroll_Basic",
    "24_Nico_Hulkenberg_Basic"
  ],
  "Masterpiece": [
    "03_Charles_Leclerc_Masterpiece_Monza"
  ],
  "Unique": [
    "08_Max_Verstappen_Unique_GT3_Nurburgring",
    "26_Max_Verstappen_Unique_Las_Vegas_Winner"
  ]
};

function getUserId(initData: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) return null;
  params.delete('hash');
  params.sort();
  const data = Array.from(params, ([key, value]) => key + '=' + value).join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(token).digest();
  const expected = createHmac('sha256', secret).update(data).digest();
  if (!timingSafeEqual(expected, Buffer.from(hash, 'hex'))) return null;
  const age = Date.now() / 1000 - Number(params.get('auth_date'));
  if (!Number.isFinite(age) || age < -60 || age > 86400) return null;
  try {
    const { id } = JSON.parse(params.get('user') || '{}');
    return Number.isSafeInteger(id) && id > 0 ? String(id) : null;
  } catch {
    return null;
  }
}

function drawCard() {
  const roll = randomInt(1000);
  const pool = roll < 869 ? POOLS.Basic : roll < 969 ? POOLS.Rare : roll < 999 ? POOLS.Unique : POOLS.Masterpiece;
  return pool[randomInt(pool.length)];
}

// Each hash field records one token spent and its card. Checking the balance and
// writing that field in one script prevents concurrent opens from overspending.
const TEST_GRANT = `pf:${SEASON}:token-grant:november-test`;

const OPEN_CARD = `
local points = tonumber(redis.call('GET', KEYS[1])) or 0
local spent = redis.call('HLEN', KEYS[2])
local bonus = redis.call('SISMEMBER', KEYS[3], ARGV[4])
local balance = math.max(0, math.floor(points / tonumber(ARGV[3])) + bonus - spent)
local existing = redis.call('HGET', KEYS[2], ARGV[1])
if existing then return {balance, existing} end
if balance == 0 then return {0, ''} end
redis.call('HSET', KEYS[2], ARGV[1], ARGV[2])
return {balance - 1, ARGV[2]}
`;

async function handleCardTokens(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();

  const initData = req.headers['x-telegram-init-data'];
  const userId = typeof initData === 'string' ? getUserId(initData) : null;
  if (!userId) return res.status(401).json({ error: 'Открой игру заново в Telegram.' });

  const requestId = req.body?.requestId;
  if (req.method === 'POST' && (typeof requestId !== 'string' || !/^[0-9a-f-]{36}$/i.test(requestId))) {
    return res.status(400).json({ error: 'Некорректный запрос на открытие.' });
  }

  const redis = createClient({ url: process.env.REDIS_URL });
  const totalKey = `pf:${SEASON}:total:${userId}`;
  const cardsKey = `pf:${SEASON}:token-cards:${userId}`;
  try {
    await redis.connect();
    if (req.method === 'GET') {
      const [rawPoints, cardIds, bonus] = await redis.multi()
        .get(totalKey).hVals(cardsKey).sIsMember(TEST_GRANT, userId).exec();
      const points = Number(rawPoints) || 0;
      const cards = cardIds as unknown as string[];
      const balance = Math.max(0, Math.floor(points / POINTS_PER_TOKEN) + Number(bonus) - cards.length);
      return res.status(200).json({ points, balance, cardIds: cards });
    }

    const [balance, cardId] = await redis.eval(OPEN_CARD, {
      keys: [totalKey, cardsKey, TEST_GRANT],
      arguments: [requestId, drawCard(), String(POINTS_PER_TOKEN), userId],
    }) as [number, string];
    if (!cardId) return res.status(409).json({ balance, error: 'Недостаточно токенов.' });
    return res.status(200).json({ balance, cardId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Не удалось загрузить награды. Попробуй ещё раз.' });
  } finally {
    if (redis.isOpen) await redis.quit().catch(() => {});
  }
}

async function grantTestToken(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  const key = req.headers['x-token-grant-key'];
  if (typeof key !== 'string' || !/^[a-f0-9]{64}$/.test(key) ||
      !timingSafeEqual(createHash('sha256').update(key).digest(), Buffer.from('8a5aab182362bf3597f2bd1014052a57ebff908f7e0d32bd2d2bcc05c5dca7c8', 'hex'))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const redis = createClient({ url: process.env.REDIS_URL });
  try {
    await redis.connect();
    const result = await redis.eval(`
      if redis.call('EXISTS', KEYS[2]) == 1 then
        return {0, tonumber(redis.call('GET', KEYS[2]))}
      end
      local count = redis.call('SUNIONSTORE', KEYS[1], KEYS[3])
      redis.call('SET', KEYS[2], count)
      return {1, count}
    `, { keys: [TEST_GRANT, TEST_GRANT + ':done', `pf:${SEASON}:users`], arguments: [] }) as [number, number];
    return res.status(200).json({ issued: result[0] === 1, users: result[1] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not issue test tokens' });
  } finally {
    if (redis.isOpen) await redis.quit().catch(() => {});
  }
}
