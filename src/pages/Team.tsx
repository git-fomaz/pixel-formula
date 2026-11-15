import { useState, useEffect } from 'react';
import { DRIVERS, calculateTeamPoints, getDriverPosition } from '../data/f1Data';

const MAX_SELECT = 2;
const STORAGE_KEY = 'pixel-formula-team';

export default function Team() {
  const [selected, setSelected] = useState<number[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSelected(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const toggleDriver = (id: number) => {
    setSaved(false);
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= MAX_SELECT) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const saveTeam = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selectedDrivers = DRIVERS.filter((d) => selected.includes(d.id));
  const teamPoints = selected.length === 2 ? calculateTeamPoints(selected) : 0;

  return (
    <div className="pixel-page">
      <h2>Выбор команды</h2>
      <p>Выбери {MAX_SELECT} пилотов на гонку</p>

      {selected.length > 0 && (
        <div className="pixel-card" style={{ marginBottom: 12 }}>
          <strong>Твой состав:</strong>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {selectedDrivers.map((d) => {
              const pos = getDriverPosition(d.id);
              return (
                <span key={d.id} className="driver-tag" style={{ borderColor: d.color }}>
                  #{d.number} {d.name.split(' ')[1]}
                  {pos && <small> (P{pos})</small>}
                </span>
              );
            })}
          </div>
          {selected.length === 2 && (
            <p style={{ marginTop: 8, fontSize: '0.7rem' }}>
              Очки за последнюю гонку: <strong style={{ color: '#ff2e63' }}>{teamPoints}</strong>
            </p>
          )}
        </div>
      )}

      <div className="drivers-list">
        {DRIVERS.map((d) => {
          const isSelected = selected.includes(d.id);
          return (
            <div
              key={d.id}
              className={`pixel-card driver-card ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleDriver(d.id)}
              style={{ borderColor: isSelected ? d.color : undefined, cursor: 'pointer' }}
            >
              <div className="driver-info">
                <strong>#{d.number} {d.name}</strong>
                <span>{d.team}</span>
              </div>
              <button className="pixel-btn" type="button">
                {isSelected ? 'Убрать' : 'Выбрать'}
              </button>
            </div>
          );
        })}
      </div>

      <button
        className="pixel-btn primary"
        style={{ marginTop: 16, width: '100%' }}
        onClick={saveTeam}
        disabled={selected.length !== MAX_SELECT}
      >
        {saved ? 'Сохранено!' : `Сохранить состав (${selected.length}/${MAX_SELECT})`}
      </button>
    </div>
  );
}
