import { createClient } from 'redis';

const SEASON = '2026';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminId = process.env.TELEGRAM_ADMIN_ID;
  if (!botToken) return res.status(500).json({ error: 'no bot token' });
  if (!adminId) return res.status(500).json({ error: 'TELEGRAM_ADMIN_ID not set' });

  const update = req.body;
  const msg = update?.message;
  if (!msg || !msg.from) return res.status(200).json({ ok: true });

  // Только сообщения от админа
  if (String(msg.from.id) !== String(adminId)) {
    return res.status(200).json({ ok: true, ignored: true });
  }

  const redis = createClient({ url: process.env.REDIS_URL });
  try {
    await redis.connect();
    const userIds = await redis.sMembers(`pf:${SEASON}:users`);

    let sent = 0;
    for (const userId of userIds) {
      if (String(userId) === String(msg.from.id)) continue; // не слать себе
      try {
        // Пересылаем оригинальное сообщение (сохраняет картинки, форматирование)
        const r = await fetch(`https://api.telegram.org/bot${botToken}/forwardMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: userId,
            from_chat_id: msg.chat.id,
            message_id: msg.message_id,
          }),
        });
        if (r.ok) sent++;
      } catch {}
    }

    // Подтверждение админу
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: msg.from.id,
        text: `Отправлено ${sent} из ${userIds.length} пользователей`,
        reply_to_message_id: msg.message_id,
      }),
    });

    return res.status(200).json({ ok: true, sent });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  } finally {
    await redis.quit().catch(() => {});
  }
}
