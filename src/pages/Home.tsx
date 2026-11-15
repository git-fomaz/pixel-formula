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
      <h2>Добро пожаловать{user ? `, ${user.first_name}` : ''}!</h2>

      <div className="pixel-card">
        <p>Pixel Formula — фэнтези Формула-1 прямо в Telegram.</p>
        <ul>
          <li>Делай прогнозы на топ-5</li>
          <li>Собирай пиксельные карточки</li>
          <li>Набирай очки и поднимайся в таблице</li>
        </ul>
        <Link to="/predict" className="pixel-btn primary" style={{ display: 'inline-block', marginTop: 8, textDecoration: 'none' }}>
          Сделать прогноз
        </Link>
      </div>

      <div className="pixel-card">
        <h3>Следующая гонка</h3>
        <p><strong>{nextRace.name}</strong></p>
        <p>{nextRace.circuit}</p>
        <p>Дата: {formatDate(nextRace.date)}</p>
        <p style={{ marginTop: 8, fontSize: '0.65rem', color: '#8888aa' }}>
          Всего этапов в сезоне: {RACES.length}
        </p>
      </div>
    </div>
  );
}
