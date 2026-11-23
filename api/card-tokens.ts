import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { createClient } from 'redis';

const SEASON = '2026';
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
const OPEN_CARD = `
local points = tonumber(redis.call('GET', KEYS[1])) or 0
local spent = redis.call('HLEN', KEYS[2])
local balance = math.max(0, math.floor(points / tonumber(ARGV[3])) - spent)
local existing = redis.call('HGET', KEYS[2], ARGV[1])
if existing then return {balance, existing} end
if balance == 0 then return {0, ''} end
redis.call('HSET', KEYS[2], ARGV[1], ARGV[2])
return {balance - 1, ARGV[2]}
`;

export default async function handler(req: any, res: any) {
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
      const [rawPoints, cardIds] = await redis.multi().get(totalKey).hVals(cardsKey).exec();
      const points = Number(rawPoints) || 0;
      const cards = cardIds as unknown as string[];
      const balance = Math.max(0, Math.floor(points / POINTS_PER_TOKEN) - cards.length);
      return res.status(200).json({ points, balance, cardIds: cards });
    }

    const [balance, cardId] = await redis.eval(OPEN_CARD, {
      keys: [totalKey, cardsKey],
      arguments: [requestId, drawCard(), String(POINTS_PER_TOKEN)],
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
