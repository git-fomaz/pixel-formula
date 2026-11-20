import { useState, useEffect, useMemo } from 'react';

const DRIVERS = [
  'Lando Norris', 'Oscar Piastri', 'George Russell', 'Kimi Antonelli',
  'Max Verstappen', 'Isack Hadjar', 'Charles Leclerc', 'Lewis Hamilton',
  'Alex Albon', 'Carlos Sainz', 'Liam Lawson', 'Arvid Lindblad',
  'Fernando Alonso', 'Lance Stroll', 'Pierre Gasly', 'Franco Colapinto',
  'Rafael Camara', 'Oliver Bearman', 'Nico Hulkenberg', 'Gabriel Bortoleto',
  'Valtteri Bottas', 'Sergio Perez'
];

const RACE = {
  id: 'las-vegas-2026',
  deadline: '2026-11-22T04:00:00Z',          // старт гонки
  qualifyingDeadline: '2026-11-21T20:00:00Z', // старт квалификации
};

type Mode = 'race' | 'qualifying';

function getTelegramUser() {
  try {
    const tg = (window as any).Telegram?.WebApp;
    const u = tg?.initDataUnsafe?.user;
    if (u?.id) return { id: String(u.id), name: u.first_name || u.username || `User ${u.id}` };
  } catch {}
  return { id: 'guest', name: 'Guest' };
}

function storageKey(mode: Mode) {
  return mode === 'race' ? `pf:prediction:${RACE.id}` : `pf:prediction:${RACE.id}-q`;
}

function serverRaceId(mode: Mode) {
  return mode === 'race' ? RACE.id : `${RACE.id}-q`;
}

function deadlineFor(mode: Mode) {
  return mode === 'race' ? RACE.deadline : RACE.qualifyingDeadline;
}

export default function Predict() {
  const [mode, setMode] = useState<Mode>('race');
  const [picks, setPicks] = useState<string[]>(Array(5).fill(''));
  const [saved, setSaved] = useState<{ picks: string[]; savedAt: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [now, setNow] = useState(Date.now());
  const user = useMemo(getTelegramUser, []);

  useEffect(() => {
    const key = storageKey(mode);
    const rid = serverRaceId(mode);

    // Reset state
    setPicks(Array(5).fill(''));
    setSaved(null);
    setEditing(false);

    // Load local
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const v = JSON.parse(raw);
        if (v.picks?.length === 5 && new Date(v.savedAt).getTime() < Date.parse(deadlineFor(mode))) {
          setSaved(v);
          setPicks(v.picks);
        }
      }
    } catch {}

    // Load from server
    if (user.id !== 'guest') {
      fetch(`/api/prediction?userId=${user.id}&raceId=${rid}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.picks?.length === 5) {
            setSaved({ picks: data.picks, savedAt: data.savedAt });
            setPicks(data.picks);
          }
        })
        .catch(() => {});
    }
  }, [mode, user.id]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const deadline = deadlineFor(mode);
  const ms = Date.parse(deadline) - now;
  const closed = ms <= 0;
  const clock = ms > 0
    ? `${Math.floor(ms / 86400000)}д ${String(Math.floor(ms / 3600000) % 24).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`
    : '00:00:00';

  const update = (index: number, value: string) => {
    const next = [...picks];
    next[index] = value;
    setPicks(next);
  };

  const save = async () => {
    if (picks.filter(Boolean).length !== 5 || new Set(picks).size !== 5) {
      alert('Выбери пять разных пилотов');
      return;
    }
    const next = { picks: [...picks], savedAt: new Date().toISOString() };
    localStorage.setItem(storageKey(mode), JSON.stringify(next));
    setSaved(next);
    setEditing(false);

    if (user.id !== 'guest') {
      try {
        await fetch('/api/prediction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            raceId: serverRaceId(mode),
            picks,
            name: user.name,
          }),
        });
      } catch {}
    }
  };

  const showEditor = !closed && (!saved || editing);
  const status = closed ? (saved ? 'Приём закрыт' : 'Этап пропущен') : saved && !editing ? 'Прогноз принят' : 'Приём открыт';

  return (
    <div className="pixel-page">
      <h2>Гран-при Лас-Вегаса</h2>
      <p className="muted">20–22 ноября 2026 · Las Vegas Strip Circuit</p>

      <div className="ios-card" style={{ overflow: 'hidden', padding: 0, border: '2px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, var(--ferrari), var(--mercedes))', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }}>
        <img
          src="/predict-banner.jpg"
          alt="Kimi Antonelli with trophy, George Russell and Charles Leclerc"
          style={{ width: '100%', display: 'block', imageRendering: 'pixelated' }}
        />
      </div>

      {/* Mode switcher */}
      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <button
          onClick={() => setMode('race')}
          className={mode === 'race' ? 'ios-btn' : 'ios-btn secondary'}
          style={{ width: 'auto', flex: 1 }}
        >
          Гонка
        </button>
        <button
          onClick={() => setMode('qualifying')}
          className={mode === 'qualifying' ? 'ios-btn' : 'ios-btn secondary'}
          style={{ width: 'auto', flex: 1 }}
        >
          Квалификация
        </button>
      </div>

      <div className="ios-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600 }}>
            {mode === 'race' ? 'Прогноз на гонку' : 'Прогноз на квалификацию'}
          </div>
          <span style={{
            background: closed ? 'var(--fill)' : 'rgba(48, 209, 88, 0.2)',
            color: closed ? 'var(--label-secondary)' : 'var(--accent-green)',
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
          }}>{status}</span>
        </div>
        <p className="muted" style={{ margin: '8px 0 0', fontSize: 13 }}>
          {mode === 'race'
            ? 'Очки считаются полностью.'
            : 'Очки считаются как половина от гонки (×0.5).'}
        </p>
        {!closed && (
          <>
            <div className="section-title" style={{ marginTop: 16 }}>До закрытия приёма</div>
            <div style={{ fontSize: 32, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: -1 }}>{clock}</div>
          </>
        )}
        <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>Дедлайн: {mode === 'race' ? '22 ноября, 07:00 МСК' : '21 ноября, 07:00 МСК'}</p>
        <button
          onClick={() => setShowRules(true)}
          className="ios-btn secondary"
          style={{ marginTop: 12, width: 'auto', fontSize: 14 }}
        >
          Правила начисления очков
        </button>
      </div>

      {showEditor && (
        <div className="ios-card">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            Твой прогноз · Топ-5 {mode === 'qualifying' ? '(квалификация)' : ''}
          </div>
          <p className="muted" style={{ marginTop: 0 }}>Выбери пилотов в порядке финиша.</p>
          {picks.map((v, i) => (
            <label key={i} style={{ display: 'grid', gridTemplateColumns: '36px 1fr', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <span style={{
                background: 'var(--bg-secondary)',
                color: 'var(--ferrari)',
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
            <p className="muted" style={{ margin: '4px 0 0' }}>
              {mode === 'race' ? 'Пятёрка на гонку сохранена.' : 'Пятёрка на квалификацию сохранена.'} До дедлайна можно изменить.
            </p>
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

      {showRules && (
        <div
          onClick={() => setShowRules(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="ios-card"
            style={{ maxWidth: 420, width: '100%', maxHeight: '80vh', overflow: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Правила начисления очков</div>
              <button onClick={() => setShowRules(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ fontWeight: 600, marginBottom: 6 }}>Гонка (×1)</div>
            <p className="muted" style={{ margin: '0 0 8px', fontSize: 14 }}>
              Прогноз — топ-5 в порядке финиша. Очки за точное попадание места:
            </p>
            <ul style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 14 }}>
              <li>1 место — 15 очков</li>
              <li>2 место — 12 очков</li>
              <li>3 место — 10 очков</li>
              <li>4 место — 8 очков</li>
              <li>5 место — 8 очков</li>
            </ul>
            <p className="muted" style={{ margin: '0 0 4px', fontSize: 14 }}>Бонус за количество точных попаданий:</p>
            <ul style={{ margin: '0 0 16px', paddingLeft: 18, fontSize: 14 }}>
              <li>2 точных — +2</li>
              <li>3 точных — +5</li>
              <li>4 точных — +10</li>
              <li>5 точных — +20</li>
            </ul>

            <div style={{ fontWeight: 600, marginBottom: 6 }}>Квалификация (×0.5)</div>
            <p className="muted" style={{ margin: '0 0 12px', fontSize: 14 }}>
              Та же схема, но все очки (за места и бонус) умножаются на 0.5.
            </p>

            <div style={{ fontWeight: 600, marginBottom: 6 }}>Примеры</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
              <li>1-е и 3-е в гонке → 15 + 10 + бонус 2 = 27</li>
              <li>Весь топ-5 в гонке → 73 очка</li>
              <li>1-е и 2-е в квалификации → 14.5</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

