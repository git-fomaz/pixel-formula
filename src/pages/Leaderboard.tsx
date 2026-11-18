import { useState, useEffect, useMemo } from 'react';

function getTelegramUser() {
  try {
    const tg = (window as any).Telegram?.WebApp;
    const u = tg?.initDataUnsafe?.user;
    if (u?.id) return String(u.id);
  } catch {}
  return 'guest';
}

export default function Leaderboard() {
  const [tab, setTab] = useState<'season' | 'race'>('season');
  const [q, setQ] = useState('');
  const [players, setPlayers] = useState<{ userId: string; name: string; points: number; exact: number; pos: number }[]>([]);
  const myId = useMemo(getTelegramUser, []);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.ok ? r.json() : { players: [] })
      .then(data => setPlayers(data.players || []))
      .catch(() => setPlayers([]));
  }, []);

  const rows = useMemo(() => {
    return players
      .filter(r => r.name.toLowerCase().includes(q.toLowerCase()))
      .map((r, i) => ({ ...r, pos: i + 1 }));
  }, [players, q]);

  const me = players.find(p => p.userId === myId);
  const myPos = me ? rows.find(r => r.userId === myId)?.pos ?? '—' : '—';

  return (
    <div className="pixel-page">
      <h2>Турнирная таблица</h2>
      <p className="muted">Реальные игроки</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab('season')} className={tab === 'season' ? 'ios-btn' : 'ios-btn secondary'} style={{ width: 'auto', flex: 1 }}>Сезон</button>
        <button onClick={() => setTab('race')} className={tab === 'race' ? 'ios-btn' : 'ios-btn secondary'} style={{ width: 'auto', flex: 1 }}>Этап</button>
      </div>

      <div className="stat-row" style={{ marginBottom: 16 }}>
        <div className="stat-box"><strong>{players.length}</strong><small>Игроков</small></div>
        <div className="stat-box"><strong>{me?.points ?? 0}</strong><small>Твои очки</small></div>
        <div className="stat-box"><strong>{myPos}</strong><small>Твоё место</small></div>
        <div className="stat-box"><strong>{tab === 'season' ? 'Сумма' : 'Этап'}</strong><small>Режим</small></div>
      </div>

      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск игрока" style={{ marginBottom: 12 }} />

      <div className="ios-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--label-secondary)', fontSize: 13 }}>#</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--label-secondary)', fontSize: 13 }}>Игрок</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--label-secondary)', fontSize: 13 }}>Очки</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--label-secondary)', fontSize: 13 }}>Точные</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.userId} style={r.userId === myId ? { background: 'rgba(192, 57, 43, 0.12)' } : undefined}>
                <td style={{ padding: '14px 16px', fontWeight: r.userId === myId ? 700 : 400 }}>{r.pos}</td>
                <td style={{ padding: '14px 16px', fontWeight: r.userId === myId ? 700 : 400 }}>{r.name}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--ferrari)' }}>{r.points}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--label-secondary)' }}>{r.exact}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="muted" style={{ padding: 16, textAlign: 'center' }}>Пока нет игроков</p>}
      </div>
    </div>
  );
}
