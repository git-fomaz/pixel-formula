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

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px', color: '#edf1ed', fontFamily: "'Courier New', monospace", backgroundImage: 'linear-gradient(#ffffff05 1px,transparent 1px),linear-gradient(90deg,#ffffff05 1px,transparent 1px)', backgroundSize: '24px 24px' }}>
      <div style={{ background: '#19212b', border: '3px solid #627078', boxShadow: '7px 7px #070c12', padding: 22, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 2, color: '#caff43', fontWeight: 'bold' }}>F1 PICK’EM / CHAMPIONSHIP</div>
            <h1 style={{ fontSize: 'clamp(24px,5vw,36px)', margin: '12px 0', textTransform: 'uppercase' }}>Чемпионат прогнозов</h1>
          </div>
          <span style={{ border: '2px solid #52606c', padding: 10, color: '#caff43', fontSize: 12, background: '#101820' }}>СЕЗОН 2026</span>
        </div>
        <div style={{ height: 8, background: 'conic-gradient(#ced8ce 25%,#17212b 0 50%,#ced8ce 0 75%,#17212b 0) 0 0/16px 16px', margin: '20px 0' }} />

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setTab('season')} style={tabBtn(tab === 'season')}>Сезон</button>
          <button onClick={() => setTab('race')} style={tabBtn(tab === 'race')}>Этап</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 20 }}>
          <div style={stat}><span>ИГРОКОВ</span><strong>{MOCK.length + 1}</strong></div>
          <div style={stat}><span>ТВОИ ОЧКИ</span><strong>{me}</strong></div>
          <div style={stat}><span>ТВОЁ МЕСТО</span><strong>{rows.find(r => r.name === 'Ты')?.pos ?? '—'}</strong></div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск игрока" style={{ font: 'inherit', background: '#101820', border: '2px solid #52606c', padding: 12, color: 'white', width: 300, maxWidth: '100%' }} />
          <span style={{ color: '#94a6b5', fontSize: 12 }}>{tab === 'season' ? 'Сумма по этапам' : 'Только текущий этап'}</span>
        </div>

        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620, fontSize: 13 }}>
            <thead>
              <tr>
                <th style={th}>#</th>
                <th style={th}>Игрок</th>
                <th style={th}>Очки</th>
                <th style={th}>Точные</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.name} style={r.name === 'Ты' ? { background: '#253a2c' } : undefined}>
                  <td style={{ ...td, borderLeft: r.name === 'Ты' ? '3px solid #caff43' : undefined }}>{r.pos}</td>
                  <td style={td}>{r.name}</td>
                  <td style={{ ...td, color: '#caff43', fontWeight: 'bold' }}>{r.points}</td>
                  <td style={{ ...td, color: '#caff43', fontWeight: 'bold' }}>{r.exact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <div style={{ border: '2px dashed #465563', padding: '35px 18px', textAlign: 'center', color: '#aebbc5', marginTop: 16 }}>Никого не найдено</div>}
      </div>
    </div>
  );
}

function tabBtn(active: boolean): React.CSSProperties {
  return {
    cursor: 'pointer',
    border: '2px solid ' + (active ? '#e8ffac' : '#52606c'),
    padding: 12,
    background: active ? '#caff43' : '#101820',
    color: active ? '#15200c' : '#b9c5cf',
    fontWeight: 'bold',
    boxShadow: active ? '3px 3px #050a0e' : undefined,
  };
}
const stat: React.CSSProperties = { background: '#111922', border: '2px solid #3e4b58', padding: 16 };
const th: React.CSSProperties = { textAlign: 'left', color: '#9cb0be', fontSize: 11, background: '#101820', padding: '15px 12px', borderBottom: '2px solid #52606c' };
const td: React.CSSProperties = { padding: '18px 12px', borderBottom: '1px solid #344451' };
