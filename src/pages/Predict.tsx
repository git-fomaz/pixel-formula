import { useState, useEffect } from 'react';

const DRIVERS = [
  'Lando Norris', 'Oscar Piastri', 'George Russell', 'Kimi Antonelli',
  'Max Verstappen', 'Isack Hadjar', 'Charles Leclerc', 'Lewis Hamilton',
  'Alex Albon', 'Carlos Sainz', 'Liam Lawson', 'Arvid Lindblad',
  'Fernando Alonso', 'Lance Stroll', 'Pierre Gasly', 'Franco Colapinto',
  'Esteban Ocon', 'Oliver Bearman', 'Nico Hulkenberg', 'Gabriel Bortoleto',
  'Valtteri Bottas', 'Sergio Perez'
];

const RACE = { id: 'las-vegas-2026', deadline: '2026-11-22T04:00:00Z' };
const KEY = 'pf:prediction:' + RACE.id;

export default function Predict() {
  const [picks, setPicks] = useState<string[]>(Array(5).fill(''));
  const [saved, setSaved] = useState<{ picks: string[]; savedAt: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const v = JSON.parse(raw);
        if (v.picks?.length === 5 && new Date(v.savedAt).getTime() < Date.parse(RACE.deadline)) {
          setSaved(v);
          setPicks(v.picks);
        }
      }
    } catch {}
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const ms = Date.parse(RACE.deadline) - now;
  const closed = ms <= 0;
  const clock = ms > 0
    ? `${Math.floor(ms / 86400000)}д ${String(Math.floor(ms / 3600000) % 24).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`
    : '00:00:00';

  const update = (index: number, value: string) => {
    const next = [...picks];
    next[index] = value;
    setPicks(next);
  };

  const save = () => {
    if (picks.filter(Boolean).length !== 5 || new Set(picks).size !== 5) {
      alert('Выбери пять разных пилотов');
      return;
    }
    const next = { picks: [...picks], savedAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(next));
    setSaved(next);
    setEditing(false);
  };

  const showEditor = !closed && (!saved || editing);
  const status = closed ? (saved ? 'Приём закрыт' : 'Этап пропущен') : saved && !editing ? 'Прогноз принят' : 'Приём открыт';

  return (
    <div className="pixel-page">
      <h2>Гран-при Лас-Вегаса</h2>
      <p className="muted">20–22 ноября 2026 · Las Vegas Strip Circuit</p>

      <div className="ios-card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="muted" style={{ fontSize: 13 }}>SCARLET RACER</span>
          <span style={{ fontSize: 13, color: 'var(--accent-red)', fontWeight: 600 }}>TOP 5</span>
        </div>
        <svg viewBox="0 0 640 205" role="img" aria-label="Красный пиксельный болид" style={{ width: '100%', display: 'block', imageRendering: 'pixelated' }} shapeRendering="crispEdges">
          <rect width="640" height="205" fill="#1c1c1e" />
          <path d="M0 176H640" stroke="#3a3a3c" strokeWidth="3" />
          <path d="M0 196H640" stroke="#636366" strokeWidth="3" strokeDasharray="30 22" />
          <g fill="#2c2c2e">
            <path d="M25 80V35h22v45h15V20h25v60h18V49h32v31zm438 0V29h20v51h18V40h25v40h20V18h29v62z" />
          </g>
          <path d="M80 75h85v12H80zm8 20h73v8H88z" fill="#ff453a" />
          <path d="M91 85h11v65H91zM122 141h50v-23h51v-16h32V76h24v29h48v17h70l100 24v16H122z" fill="#ff453a" />
          <path d="M170 128h65v-15h60v13h80v10H170z" fill="#ff6961" />
          <path d="M255 111V92h42v19" fill="none" stroke="#1c1c1e" strokeWidth="6" />
          <path d="M268 95V84h17v12z" fill="#ffd60a" />
          <path d="M270 89h14v5h-14z" fill="#64d2ff" />
          <path d="M350 140h45l105 12v7H395z" fill="#ffd60a" />
          <path d="M491 151h69v10h-69zm-4 14h78v9h-78z" fill="#ff453a" />
          <path d="M552 144h11v31h-11z" fill="#d70015" />
          <path d="M216 126h11v18h-11z" fill="#ffd60a" />
          <path d="M317 137h28v6h-28z" fill="#fff" />
          <g fill="#000">
            <path d="M120 130h46v8h8v37h-8v9h-46v-9h-8v-37h8zM480 130h40v8h8v37h-8v9h-40v-9h-8v-37h8z" />
          </g>
          <g fill="#ffd60a">
            <path d="M128 140h30v33h-30zM486 140h28v33h-28z" />
          </g>
          <g fill="#636366">
            <path d="M134 146h18v21h-18zM492 146h16v21h-16z" />
          </g>
        </svg>
      </div>

      <div className="ios-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600 }}>Ближайший этап</div>
          <span style={{
            background: closed ? 'var(--fill)' : 'rgba(48, 209, 88, 0.2)',
            color: closed ? 'var(--label-secondary)' : 'var(--accent-green)',
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
          }}>{status}</span>
        </div>
        {!closed && (
          <>
            <div className="section-title" style={{ marginTop: 16 }}>До закрытия приёма</div>
            <div style={{ fontSize: 32, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: -1 }}>{clock}</div>
          </>
        )}
        <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>Дедлайн: 22 ноября, 07:00 МСК</p>
      </div>

      {showEditor && (
        <div className="ios-card">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Твой прогноз · Топ-5</div>
          <p className="muted" style={{ marginTop: 0 }}>Выбери пилотов в порядке финиша.</p>
          {picks.map((v, i) => (
            <label key={i} style={{ display: 'grid', gridTemplateColumns: '36px 1fr', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <span style={{
                background: 'var(--bg-secondary)',
                color: 'var(--accent)',
                width: 36,
                height: 36,
                borderRadius: 10,
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
              }}>{i + 1}</span>
              <select value={v} onChange={e => update(i, e.target.value)}>
                <option value="">Выбрать пилота</option>
                {DRIVERS.map(d => (
                  <option key={d} value={d} disabled={picks.includes(d) && picks[i] !== d}>{d}</option>
                ))}
              </select>
            </label>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={save} className="ios-btn">Подтвердить прогноз</button>
            {saved && <button onClick={() => setEditing(false)} className="ios-btn secondary" style={{ width: 'auto' }}>Отмена</button>}
          </div>
        </div>
      )}

      {saved && !editing && (
        <div className="ios-card">
          <div style={{ background: 'rgba(48, 209, 88, 0.15)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-green)' }}>Прогноз принят</div>
            <p className="muted" style={{ margin: '4px 0 0' }}>Пятёрка сохранена. До дедлайна можно изменить.</p>
            <p className="muted" style={{ margin: '8px 0 0', fontSize: 13 }}>
              Сохранено: {new Date(saved.savedAt).toLocaleString('ru-RU')}
            </p>
            {!closed && <button onClick={() => setEditing(true)} className="ios-btn secondary" style={{ marginTop: 12, width: 'auto' }}>Изменить прогноз</button>}
          </div>
          <div className="section-title">Твой прогноз</div>
          <ol style={{ paddingLeft: 20, margin: 0 }}>
            {saved.picks.map((p, i) => <li key={i} style={{ marginBottom: 6 }}>{p}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}
