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

  return (
    <div className="pixel-page" style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ background: '#19212b', border: '3px solid #627078', boxShadow: '7px 7px #070c12', padding: 22 }}>
        <div style={{ color: '#caff43', fontSize: 11, letterSpacing: 2 }}>F1 PICK’EM / RACE WEEK</div>
        <h1 style={{ textTransform: 'uppercase', fontSize: 'clamp(23px,5vw,34px)', margin: '12px 0' }}>Гран-при Лас-Вегаса</h1>
        <p style={{ color: '#aebbc5' }}>20–22 ноября 2026 · Las Vegas Strip Circuit</p>

        <div style={{ background: '#0c141e', border: '2px solid #52606c', marginTop: 20 }}>
          <div style={{ padding: 10, color: '#caff43', fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
            <span>SCARLET RACER</span><span>LIGHTS OUT. / TOP 5</span>
          </div>
          <svg viewBox="0 0 640 205" role="img" aria-label="Красный пиксельный болид" style={{ width: '100%', display: 'block', imageRendering: 'pixelated' }} shapeRendering="crispEdges">
            <rect width="640" height="205" fill="#0c141e" />
            <path d="M0 176H640" stroke="#344958" strokeWidth="3" />
            <path d="M0 196H640" stroke="#83939e" strokeWidth="3" strokeDasharray="30 22" />
            <g fill="#233545">
              <path d="M25 80V35h22v45h15V20h25v60h18V49h32v31zm438 0V29h20v51h18V40h25v40h20V18h29v62z" />
            </g>
            <path d="M80 75h85v12H80zm8 20h73v8H88z" fill="#e52b36" />
            <path d="M91 85h11v65H91zM122 141h50v-23h51v-16h32V76h24v29h48v17h70l100 24v16H122z" fill="#e92332" />
            <path d="M170 128h65v-15h60v13h80v10H170z" fill="#ff555b" />
            <path d="M255 111V92h42v19" fill="none" stroke="#18212a" strokeWidth="6" />
            <path d="M268 95V84h17v12z" fill="#ffe278" />
            <path d="M270 89h14v5h-14z" fill="#348598" />
            <path d="M350 140h45l105 12v7H395z" fill="#ffd966" />
            <path d="M491 151h69v10h-69zm-4 14h78v9h-78z" fill="#ec2734" />
            <path d="M552 144h11v31h-11z" fill="#aa1427" />
            <path d="M216 126h11v18h-11z" fill="#ffdd54" />
            <path d="M317 137h28v6h-28z" fill="#fff3dd" />
            <g fill="#05080d">
              <path d="M120 130h46v8h8v37h-8v9h-46v-9h-8v-37h8zM480 130h40v8h8v37h-8v9h-40v-9h-8v-37h8z" />
            </g>
            <g fill="#d9b64e">
              <path d="M128 140h30v33h-30zM486 140h28v33h-28z" />
            </g>
            <g fill="#45525e">
              <path d="M134 146h18v21h-18zM492 146h16v21h-16z" />
            </g>
          </svg>
        </div>
        <div style={{ height: 8, background: 'conic-gradient(#ced8ce 25%,#17212b 0 50%,#ced8ce 0 75%,#17212b 0) 0 0/16px 16px', marginTop: 16 }} />
      </div>

      <div style={{ background: '#111922', border: '2px solid #3e4b58', padding: 16, marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Ближайший этап</h2>
          <span style={{ color: '#caff43', fontSize: 11, border: '1px solid #52606c', padding: 9 }}>
            {closed ? (saved ? 'ПРИЁМ ЗАКРЫТ' : 'ЭТАП ПРОПУЩЕН') : saved && !editing ? 'ПРОГНОЗ ПРИНЯТ' : 'ПРИЁМ ОТКРЫТ'}
          </span>
        </div>
        {!closed && (
          <>
            <div style={{ color: '#caff43', fontSize: 11, letterSpacing: 2, marginTop: 12 }}>ДО ЗАКРЫТИЯ ПРИЁМА</div>
            <div style={{ fontSize: 'clamp(23px,6vw,36px)', color: '#caff43', fontVariantNumeric: 'tabular-nums', margin: '12px 0' }}>{clock}</div>
          </>
        )}
        <p style={{ color: '#97a9b5', fontSize: 12 }}>Дедлайн: 22 ноября, 07:00 МСК</p>
      </div>

      {showEditor && (
        <div style={{ background: '#111922', border: '2px solid #3e4b58', padding: 16, marginTop: 20 }}>
          <div style={{ color: '#caff43', fontSize: 11, letterSpacing: 2 }}>ТВОЙ ПРОГНОЗ / ТОП-5</div>
          <p>Выбери пилотов в порядке финиша.</p>
          {picks.map((v, i) => (
            <label key={i} style={{ display: 'grid', gridTemplateColumns: '34px 1fr', alignItems: 'center', gap: 10, marginTop: 12 }}>
              <span style={{ background: '#253340', color: '#caff43', padding: 9, textAlign: 'center' }}>{i + 1}</span>
              <select value={v} onChange={e => update(i, e.target.value)} style={{ width: '100%', padding: '14px 10px', background: '#101820', color: 'white', border: '2px solid #52606c', font: 'inherit' }}>
                <option value="">Выбрать пилота</option>
                {DRIVERS.map(d => (
                  <option key={d} value={d} disabled={picks.includes(d) && picks[i] !== d}>{d}</option>
                ))}
              </select>
            </label>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={save} style={{ padding: 12, border: '2px solid #e8ffac', background: '#caff43', color: '#15200c', fontWeight: 'bold', cursor: 'pointer' }}>
              Подтвердить прогноз
            </button>
            {saved && <button onClick={() => setEditing(false)} style={{ padding: 12, border: '2px solid #52606c', background: '#192832', color: '#caff43', cursor: 'pointer' }}>Отмена</button>}
          </div>
        </div>
      )}

      {saved && !editing && (
        <div style={{ background: '#111922', border: '2px solid #3e4b58', padding: 16, marginTop: 20 }}>
          <div style={{ border: '2px solid #87b84b', background: '#1d3024', padding: 14, marginBottom: 18 }}>
            <h2 style={{ color: '#caff43', margin: 0 }}>Прогноз принят</h2>
            <p>Пятёрка сохранена. До дедлайна можно изменить.</p>
            <p style={{ fontSize: 12 }}>Сохранено: {new Date(saved.savedAt).toLocaleString('ru-RU')}</p>
            {!closed && <button onClick={() => setEditing(true)} style={{ padding: 12, border: '2px solid #52606c', background: '#192832', color: '#caff43', cursor: 'pointer', marginTop: 8 }}>Изменить прогноз</button>}
          </div>
          <div style={{ color: '#caff43', fontSize: 11, letterSpacing: 2 }}>ТВОЙ ПРОГНОЗ</div>
          <ol style={{ paddingLeft: 20 }}>
            {saved.picks.map((p, i) => <li key={i}>{p}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}
