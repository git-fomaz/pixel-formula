import { useState, useMemo } from 'react';

const MOCK = [
  { name: 'PixelPilot', points: 142, exact: 3 },
  { name: 'NitroNerd', points: 128, exact: 2 },
  { name: 'GridGhost', points: 115, exact: 1 },
  { name: 'TurboToast', points: 98, exact: 1 },
  { name: 'ApexAnon', points: 87, exact: 0 },
];

function myPoints() {
  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('pf:race-result:v1:')) {
        const v = JSON.parse(localStorage.getItem(k) || '{}');
        if (typeof v.points === 'number') total += v.points;
      }
    }
  } catch {}
  return total;
}

export default function Leaderboard() {
  const [tab, setTab] = useState<'season' | 'race'>('season');
  const [q, setQ] = useState('');
  const me = useMemo(myPoints, []);

  const rows = useMemo(() => {
    const all = [...MOCK, { name: 'Ты', points: me, exact: 0 }];
    return all
      .filter(r => r.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.points - a.points)
      .map((r, i) => ({ ...r, pos: i + 1 }));
  }, [me, q]);

  const myPos = rows.find(r => r.name === 'Ты')?.pos ?? '—';

  return (
    <div className="pixel-page">
      <h2>Турнирная таблица</h2>
      <p className="muted">Сравни свой результат с другими игроками</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab('season')} className={tab === 'season' ? 'ios-btn' : 'ios-btn secondary'} style={{ width: 'auto', flex: 1 }}>Сезон</button>
        <button onClick={() => setTab('race')} className={tab === 'race' ? 'ios-btn' : 'ios-btn secondary'} style={{ width: 'auto', flex: 1 }}>Этап</button>
      </div>

      <div className="stat-row" style={{ marginBottom: 16 }}>
        <div className="stat-box"><strong>{MOCK.length + 1}</strong><small>Игроков</small></div>
        <div className="stat-box"><strong>{me}</strong><small>Твои очки</small></div>
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
              <tr key={r.name} style={r.name === 'Ты' ? { background: 'rgba(10, 132, 255, 0.12)' } : undefined}>
                <td style={{ padding: '14px 16px', fontWeight: r.name === 'Ты' ? 700 : 400 }}>{r.pos}</td>
                <td style={{ padding: '14px 16px', fontWeight: r.name === 'Ты' ? 700 : 400 }}>{r.name}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--accent)' }}>{r.points}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--label-secondary)' }}>{r.exact}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="muted" style={{ padding: 16, textAlign: 'center' }}>Никого не найдено</p>}
      </div>
    </div>
  );
}
