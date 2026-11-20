import { createClient } from 'redis';

const SEASON = '2026';

// Next qualifying start (UTC). Update for each race.
const NEXT_QUALIFYING = '2026-11-21T04:00:00Z'; // Las Vegas 21 Nov 07:00 MSK
const RACE_NAME = 'Гран-при Лас-Вегаса';

export default async function handler(req: any, res: any) {
  // Optional protection
  const secret = process.env.NOTIFY_SECRET;
  if (secret && req.headers['x-notify-secret'] !== secret && req.body?.secret !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN not set' });
  }

  const now = Date.now();
  const qualiTime = Date.parse(NEXT_QUALIFYING);
  const hoursLeft = (qualiTime - now) / (1000 * 60 * 60);

  // Only send if we're roughly 24h before (23–25h window)
  if (hoursLeft < 23 || hoursLeft > 25) {
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: `not in 24h window (hours left: ${hoursLeft.toFixed(1)})`,
    });
  }

  const redis = createClient({ url: process.env.REDIS_URL });
  try {
    await redis.connect();

    // Prevent double-send
    const sentKey = `pf:${SEASON}:notified:quali:${NEXT_QUALIFYING}`;
    if (await redis.get(sentKey)) {
      return res.status(200).json({ ok: true, skipped: true, reason: 'already sent' });
    }

    const userIds = await redis.sMembers(`pf:${SEASON}:users`);
    const text =
      `🏁 ${RACE_NAME}\n\n` +
      `Квалификация стартует через ~24 часа.\n` +
      `Не забудь сделать прогноз на квалификацию и гонку!`;

    let sent = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: userId,
            text,
            parse_mode: 'HTML',
          }),
        });
        if (r.ok) sent++;
        else failed++;
      } catch {
        failed++;
      }
    }

    // Mark as sent
    await redis.set(sentKey, new Date().toISOString());

    return res.status(200).json({ ok: true, sent, failed, total: userIds.length });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'notify failed' });
  } finally {
    await redis.quit().catch(() => {});
  }
}
