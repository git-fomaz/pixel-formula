import { createClient } from 'redis';
import { PREDICTION_RACES } from '../server/prediction-calendar.mjs';

const SEASON = '2026';
const HOUR = 60 * 60 * 1000;

function canNotify(req: any) {
  const cronSecret = process.env.CRON_SECRET;
  const notifySecret = process.env.NOTIFY_SECRET;
  return (req.method === 'GET' && !!cronSecret && req.headers.authorization === `Bearer ${cronSecret}`) ||
    (!!notifySecret && (req.headers['x-notify-secret'] === notifySecret || req.body?.secret === notifySecret));
}

function canBroadcast(req: any) {
  const secret = process.env.NOTIFY_SECRET || process.env.SCORE_SECRET;
  return !!secret && req.body?.secret === secret;
}

function nextQualifying(now: number) {
  return [...PREDICTION_RACES]
    .map(race => ({ name: race.name, start: Date.parse(race.qualifyingDeadline) }))
    .filter(race => race.start > now)
    .sort((a, b) => a.start - b.start)[0];
}

export default async function handler(req: any, res: any) {
  const operation = req.query?.operation;
  const reminder = operation === 'notify';
  if (!reminder && operation !== 'broadcast') return res.status(404).end();
  if (req.method !== 'POST' && !(reminder && req.method === 'GET')) return res.status(405).end();
  if (!(reminder ? canNotify(req) : canBroadcast(req))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let text = req.body?.text;
  let sentKey: string | undefined;
  if (reminder) {
    const now = Date.now();
    const event = nextQualifying(now);
    const hoursLeft = event ? (event.start - now) / HOUR : Infinity;
    // One daily run will fall in this 24-hour window regardless of start time.
    if (!event || hoursLeft < 12 || hoursLeft > 36) {
      return res.status(200).json({ ok: true, skipped: true, reason: 'outside reminder window' });
    }

    const startsAt = new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Moscow', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    }).format(event.start);
    text = `🏁 ${event.name}\n\nКвалификация начнётся ${startsAt} МСК. Сделай прогноз в Pixel Formula!`;
    sentKey = `pf:${SEASON}:notified:quali:${new Date(event.start).toISOString().replace('.000Z', 'Z')}`;
  }
  if (typeof text !== 'string' || !text || text.length > 4000) {
    return res.status(400).json({ error: 'text required (max 4000 chars)' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN not set' });

  const redis = createClient({ url: process.env.REDIS_URL });
  try {
    await redis.connect();
    const users = await redis.sMembers(`pf:${SEASON}:users`);
    if (sentKey && !await redis.set(sentKey, new Date().toISOString(), { NX: true, EX: 172800 })) {
      return res.status(200).json({ ok: true, skipped: true, reason: 'already sent' });
    }

    let sent = 0;
    for (const chat_id of users) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id, text }),
        });
        if (response.ok) sent++;
      } catch {
        // Continue delivering to other players.
      }
    }

    return res.status(200).json({ ok: true, sent, failed: users.length - sent, total: users.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Messaging failed' });
  } finally {
    if (redis.isOpen) await redis.quit().catch(() => {});
  }
}
