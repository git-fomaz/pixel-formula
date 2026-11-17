import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getNextRace, RACES } from '../data/f1Data';

const DEADLINE = '2026-11-22T04:00:00Z';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [now, setNow] = useState(Date.now());
  const nextRace = getNextRace();

  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.initDataUnsafe?.user) setUser(tg.initDataUnsafe.user);
      else setUser({ first_name: 'Guest', id: 0 });
    } catch {
      setUser({ first_name: 'Guest', id: 0 });
    }
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const ms = Date.parse(DEADLINE) - now;
  const clock = ms > 0
    ? `${Math.floor(ms / 86400000)}д ${String(Math.floor(ms / 3600000) % 24).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`
    : '00:00:00';

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="pixel-page">
      <div style={{ margin: '0 -16px 16px', borderRadius: 0 }}>
        <img
          src="/header-banner.jpg"
          alt="Pixel Formula — Champions Lineup"
          style={{ width: '100%', display: 'block', imageRendering: 'pixelated', borderRadius: 0 }}
        />
      </div>

      <h2>Привет{user ? `, ${user.first_name}` : ''}!</h2>

      <div className="ios-card">
        <p style={{ margin: '0 0 12px', fontWeight: 600 }}>Fantasy F1: Pixel Formula 2027 beta.</p>
        <ul style={{ margin: '0 0 16px', paddingLeft: 20, color: 'var(--label-secondary)' }}>
          <li>Делай прогнозы на топ-5</li>
          <li>Соревнуйся с друзьями</li>
          <li>Собирай коллекционные карты</li>
        </ul>
        <Link to="/predict" className="ios-btn">Сделать прогноз</Link>
      </div>

      <div className="section-title">Следующая гонка</div>
      <div className="ios-card">
        <div style={{ fontSize: 20, fontWeight: 700 }}>{nextRace.name}</div>
        <div className="muted">{nextRace.circuit}</div>
        <div style={{ marginTop: 8, color: 'var(--accent)' }}>{formatDate(nextRace.date)}</div>
        <div style={{ marginTop: 16 }}>
          <div className="muted" style={{ fontSize: 13 }}>До закрытия приёма</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5, marginTop: 4 }}>{clock}</div>
        </div>
        <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          Всего этапов: {RACES.length}
        </div>
      </div>

      <div className="section-title">Быстрые действия</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Link to="/collection" className="ios-btn secondary" style={{ width: 'auto' }}>Коллекция</Link>
        <Link to="/leaderboard" className="ios-btn secondary" style={{ width: 'auto' }}>Таблица</Link>
      </div>
    </div>
  );
}
