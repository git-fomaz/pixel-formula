import { useState } from 'react';

const DRIVERS = [
  'Lando Norris', 'Oscar Piastri', 'George Russell', 'Kimi Antonelli',
  'Max Verstappen', 'Isack Hadjar', 'Charles Leclerc', 'Lewis Hamilton',
  'Alex Albon', 'Carlos Sainz', 'Liam Lawson', 'Arvid Lindblad',
  'Fernando Alonso', 'Lance Stroll', 'Pierre Gasly', 'Franco Colapinto',
  'Esteban Ocon', 'Oliver Bearman', 'Nico Hulkenberg', 'Gabriel Bortoleto',
  'Valtteri Bottas', 'Sergio Perez'
];

export default function Predict() {
  const [picks, setPicks] = useState<string[]>(Array(5).fill(''));
  const [saved, setSaved] = useState(false);

  const update = (index: number, value: string) => {
    const next = [...picks];
    next[index] = value;
    setPicks(next);
    setSaved(false);
  };

  const save = () => {
    if (picks.filter(Boolean).length !== 5 || new Set(picks).size !== 5) {
      alert('Выбери 5 разных пилотов');
      return;
    }
    localStorage.setItem('pf:prediction:las-vegas-2026', JSON.stringify({ picks, savedAt: new Date().toISOString() }));
    setSaved(true);
  };

  return (
    <div className="pixel-page">
      <h2>Прогноз · Лас-Вегас</h2>
      <p>Выбери топ-5 в порядке финиша</p>
      {picks.map((v, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <label>{i + 1}. </label>
          <select value={v} onChange={e => update(i, e.target.value)} style={{ width: '100%', padding: 8 }}>
            <option value="">Выбрать пилота</option>
            {DRIVERS.map(d => (
              <option key={d} value={d} disabled={picks.includes(d) && picks[i] !== d}>{d}</option>
            ))}
          </select>
        </div>
      ))}
      <button className="pixel-btn primary" onClick={save} style={{ marginTop: 12, width: '100%' }}>
        {saved ? 'Сохранено' : 'Подтвердить прогноз'}
      </button>
    </div>
  );
}
