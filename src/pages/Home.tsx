import { useState, useEffect } from 'react';
import { getNextRace, RACES, calculateTeamPoints } from '../data/f1Data';

const TEAM_KEY = 'pixel-formula-team';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [teamPoints, setTeamPoints] = useState(0);
  const [hasTeam, setHasTeam] = useState(false);
  const nextRace = getNextRace();

  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      } else {
        setUser({ first_name: 'Guest', id: 0 });
      }
    } catch {
      setUser({ first_name: 'Guest', id: 0 });
    }

    const stored = localStorage.getItem(TEAM_KEY);
    if (stored) {
      try {
        const ids: number[] = JSON.parse(stored);
        if (ids.length === 2) {
          setHasTeam(true);
          setTeamPoints(calculateTeamPoints(ids));
        }
      } catch {}
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
        <h3>Твои очки</h3>
        {hasTeam ? (
          <>
            <p style={{ fontSize: '1.4rem', color: '#ff2e63', margin: '8px 0' }}>
              {teamPoints}
            </p>
            <p style={{ fontSize: '0.65rem', color: '#8888aa' }}>
              За последнюю гонку (мок)
            </p>
          </>
        ) : (
          <p>Выбери состав на экране «Команда», чтобы получать очки</p>
        )}
      </div>

      <div className="pixel-card">
        <p>Pixel Formula — фэнтези Формула-1 прямо в Telegram.</p>
        <ul>
          <li>Создавай и вступай в лиги</li>
          <li>Выбирай пилотов на гонку</li>
          <li>Набирай очки и поднимайся в таблице</li>
        </ul>
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
