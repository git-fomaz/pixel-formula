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

    // Команда удаления последней рассылки
    if (msg.text === '/delete' || msg.text === '/удалить') {
      const raw = await redis.get(`pf:${SEASON}:last-broadcast`);
      if (!raw) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: msg.from.id, text: 'Нет сохранённой рассылки для удаления' }),
        });
        return res.status(200).json({ ok: true });
      }
      const items: { chatId: string; messageId: number }[] = JSON.parse(raw);
      let deleted = 0;
      for (const item of items) {
        try {
          const r = await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: item.chatId, message_id: item.messageId }),
          });
          if (r.ok) deleted++;
        } catch {}
      }
      await redis.del(`pf:${SEASON}:last-broadcast`);
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: msg.from.id, text: `Удалено ${deleted} из ${items.length}` }),
      });
      return res.status(200).json({ ok: true, deleted });
    }

    // Обычная рассылка
    const userIds = await redis.sMembers(`pf:${SEASON}:users`);
    const sentItems: { chatId: string; messageId: number }[] = [];

    for (const userId of userIds) {
      if (String(userId) === String(msg.from.id)) continue;
      try {
        const r = await fetch(`https://api.telegram.org/bot${botToken}/forwardMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: userId,
            from_chat_id: msg.chat.id,
            message_id: msg.message_id,
          }),
        });
        if (r.ok) {
          const data = await r.json();
          if (data.result?.message_id) {
            sentItems.push({ chatId: userId, messageId: data.result.message_id });
          }
        }
      } catch {}
    }

    // Сохраняем id для возможного удаления
    if (sentItems.length) {
      await redis.set(`pf:${SEASON}:last-broadcast`, JSON.stringify(sentItems));
    }

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: msg.from.id,
        text: `Отправлено ${sentItems.length} из ${userIds.length}.\nЧтобы удалить — напиши /delete`,
        reply_to_message_id: msg.message_id,
      }),
    });

    return res.status(200).json({ ok: true, sent: sentItems.length });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  } finally {
    await redis.quit().catch(() => {});
  }
}
