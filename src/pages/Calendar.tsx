import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

const RACES = [
  { id: 'australia', num: '01', name: 'Австралия', dates: '06–08 марта', state: 'past', season: false },
  { id: 'china', num: '02', name: 'Китай', dates: '13–15 марта', state: 'past', season: false },
  { id: 'japan', num: '03', name: 'Япония', dates: '27–29 марта', state: 'past', season: false },
  { id: 'miami', num: '04', name: 'Майами', dates: '01–03 мая', state: 'past', season: false },
  { id: 'canada', num: '05', name: 'Канада', dates: '22–24 мая', state: 'past', season: false },
  { id: 'monaco', num: '06', name: 'Монако', dates: '05–07 июня', state: 'past', season: false },
  { id: 'barcelona', num: '07', name: 'Барселона — Каталунья', dates: '12–14 июня', state: 'past', season: false },
  { id: 'austria', num: '08', name: 'Австрия', dates: '26–28 июня', state: 'past', season: false },
  { id: 'britain', num: '09', name: 'Великобритания', dates: '03–05 июля', state: 'past', season: false },
  { id: 'belgium', num: '10', name: 'Бельгия', dates: '17–19 июля', state: 'past', season: false },
  { id: 'hungary', num: '11', name: 'Венгрия', dates: '24–26 июля', state: 'past', season: false },
  { id: 'netherlands', num: '12', name: 'Нидерланды', dates: '21–23 августа', state: 'past', season: false },
  { id: 'italy', num: '13', name: 'Италия', dates: '04–06 сентября', state: 'past', season: false },
  { id: 'spain', num: '14', name: 'Испания', dates: '11–13 сентября', state: 'past', season: false },
  { id: 'azerbaijan', num: '15', name: 'Азербайджан', dates: '24–26 сентября', state: 'past', season: false },
  { id: 'bahrain', num: '16', name: 'Бахрейн — этап в Малайзии', dates: '02–04 октября', state: 'past', season: false },
  { id: 'singapore', num: '17', name: 'Сингапур', dates: '09–11 октября', state: 'past', season: false },
  { id: 'usa', num: '18', name: 'США — Остин', dates: '23–25 октября', state: 'past', season: false },
  { id: 'mexico', num: '19', name: 'Мексика', dates: '30 октября – 01 ноября', state: 'past', season: false },
  { id: 'brazil', num: '20', name: 'Бразилия', dates: '06–08 ноября', state: 'past', season: false },
  { id: 'las-vegas', num: '21', name: 'Лас-Вегас', dates: '19–21 ноября', state: 'future', season: false },
  { id: 'qatar', num: '22', name: 'Катар', dates: '27–29 ноября', state: 'future', season: true },
  { id: 'abu-dhabi', num: '23', name: 'Абу-Даби', dates: '04–06 декабря', state: 'future', season: true },
];

function statusLabel(state: string, id: string) {
  if (id === 'las-vegas') return 'Следующая';
  if (state === 'past') return 'Завершена';
  return 'Впереди';
}

export default function Calendar() {
  const [filter, setFilter] = useState<'all' | 'past' | 'future' | 'season'>('all');

  const points = useMemo(() => {
    const map: Record<string, number | null> = {};
    try {
      for (const r of RACES) {
        const raw = localStorage.getItem('pf:race-result:v1:' + r.id);
        if (raw) {
          const v = JSON.parse(raw);
          map[r.id] = typeof v.points === 'number' ? v.points : null;
        } else map[r.id] = null;
      }
    } catch {}
    return map;
  }, []);

  const seasonTotal = Object.entries(points)
    .filter(([id]) => RACES.find(r => r.id === id)?.season)
    .reduce((s, [, p]) => s + (p ?? 0), 0);

  const filtered = RACES.filter(r => {
    if (filter === 'past') return r.state === 'past';
    if (filter === 'future') return r.state === 'future';
    if (filter === 'season') return r.season;
    return true;
  });

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '18px 16px', color: '#f4eedc', fontFamily: "'Courier New', monospace", lineHeight: 1.5 }}>
      <div style={{ fontSize: 11, letterSpacing: 2, color: '#afc3da' }}>PIXEL FORMULA / SEASON CALENDAR</div>
      <h1 style={{ fontSize: 'clamp(26px,7vw,42px)', margin: '8px 0' }}>Календарь сезона 2026</h1>
      <p style={{ color: '#b2c4d9', fontSize: 12 }}>Основные гонки, без спринтов и тестов.</p>

      <section style={panel}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          <div style={stat}><strong>20 / 23</strong><small>ГОНОК ЗАВЕРШЕНО</small></div>
          <div style={stat}><strong>3</strong><small>ГОНКИ ВПЕРЕДИ</small></div>
          <div style={stat}><strong>{seasonTotal || '—'}</strong><small>ТВОИ ОЧКИ В ЗАЧЁТЕ</small></div>
        </div>
      </section>

      <section style={panel}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: '#afc3da' }}>СЛЕДУЮЩАЯ ГОНКА · ЭТАП 21</div>
        <h2>Лас-Вегас</h2>
        <p>19–21 ноября 2026 · даты уикенда по месту проведения</p>
        <p style={{ borderLeft: '3px solid #e3c16b', padding: 12, background: '#081b30', fontSize: 12 }}>
          Лас-Вегас — предсезонный этап приложения. Сезонный зачёт приложения начинается с Катара, 27–29 ноября.
        </p>
        <Link to="/predict" style={button}>Перейти к прогнозу</Link>
      </section>

      <section style={panel}>
        <h2>Все этапы и твои очки</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
          {(['all', 'past', 'future', 'season'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              ...button,
              background: filter === f ? '#e3c16b' : '#142e4c',
              color: filter === f ? '#07172c' : '#f4eedc',
            }}>
              {f === 'all' && 'Все — 23'}
              {f === 'past' && 'Прошедшие — 20'}
              {f === 'future' && 'Будущие — 3'}
              {f === 'season' && 'Зачёт приложения — 2'}
            </button>
          ))}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={th}>№</th>
                <th style={th}>Гран-при</th>
                <th style={th}>Даты</th>
                <th style={th}>Статус</th>
                <th style={th}>Твои очки</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ ...td, color: '#9db7d1' }}>{r.num}</td>
                  <td style={td}>
                    <strong style={{ fontSize: 13 }}>{r.name}</strong>
                    <small style={{ display: 'block', fontSize: 10, color: '#b2c4d9' }}>
                      {r.season ? 'Сезонный зачёт приложения' : 'Вне сезонного зачёта приложения'}
                    </small>
                  </td>
                  <td style={td}>{r.dates}</td>
                  <td style={td}>
                    <span style={{
                      border: '1px solid #526e89', display: 'inline-block', padding: '5px 7px', fontSize: 10,
                      color: r.id === 'las-vegas' ? '#e9ce7c' : undefined,
                      borderColor: r.id === 'las-vegas' ? '#e9ce7c' : undefined,
                    }}>
                      {statusLabel(r.state, r.id)}
                    </span>
                  </td>
                  <td style={{ ...td, color: '#e8ce81' }}>
                    {points[r.id] != null ? points[r.id] : '—'}
                    <small style={{ display: 'block', fontSize: 10, color: '#b2c4d9' }}>
                      {points[r.id] != null ? '' : 'Нет данных игрока'}
                    </small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: '#b2c4d9', fontSize: 12, marginTop: 12 }}>Показано: {filtered.length} этапов.</p>
      </section>
    </div>
  );
}

const panel: React.CSSProperties = { background: '#10253e', border: '2px solid #7b8ea3', padding: 20, margin: '20px 0', boxShadow: '5px 5px #020915' };
const stat: React.CSSProperties = { border: '1px solid #526e89', padding: 14 };
const button: React.CSSProperties = { minHeight: 48, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 14px', textDecoration: 'none', font: "700 12px 'Courier New', monospace", border: '2px solid #e9dfc5', background: '#142e4c', color: '#f4eedc', cursor: 'pointer' };
const th: React.CSSProperties = { fontSize: 10, color: '#aec1d9', padding: '12px 8px', borderBottom: '2px solid #7b8ea3' };
const td: React.CSSProperties = { padding: '15px 8px', borderBottom: '1px solid #38516b', verticalAlign: 'top' };
