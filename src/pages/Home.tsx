import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getNextRace, RACES } from '../data/f1Data';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const nextRace = getNextRace();

  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.initDataUnsafe?.user) setUser(tg.initDataUnsafe.user);
      else setUser({ first_name: 'Guest', id: 0 });
    } catch {
      setUser({ first_name: 'Guest', id: 0 });
    }
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="pixel-page">
      <h2>Привет{user ? `, ${user.first_name}` : ''}!</h2>

      <div className="ios-card">
        <p className="muted" style={{ margin: '0 0 12px' }}>Фэнтези Формула-1 прямо в Telegram</p>
        <ul style={{ margin: '0 0 16px', paddingLeft: 20, color: 'var(--label-secondary)' }}>
          <li>Делай прогнозы на топ-5</li>
          <li>Собирай пиксельные карточки</li>
          <li>Набирай очки и поднимайся в таблице</li>
        </ul>
        <Link to="/predict" className="ios-btn">Сделать прогноз</Link>
      </div>

      <div className="section-title">Следующая гонка</div>
      <div className="ios-card">
        <div style={{ fontSize: 20, fontWeight: 700 }}>{nextRace.name}</div>
        <div className="muted">{nextRace.circuit}</div>
        <div style={{ marginTop: 8, color: 'var(--accent)' }}>{formatDate(nextRace.date)}</div>
        <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          Всего этапов: {RACES.length}
        </div>
      </div>

      <div className="section-title">Быстрые действия</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Link to="/collection" className="ios-btn secondary" style={{ width: 'auto' }}>Коллекция</Link>
        <Link to="/reward" className="ios-btn secondary" style={{ width: 'auto' }}>Награда</Link>
      </div>
    </div>
  );
}
