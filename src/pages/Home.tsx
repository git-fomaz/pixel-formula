import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getNextRace, RACES } from '../data/f1Data';
import { fetchLastResults, DRIVER_AVATAR, driverInitials, type LastRacePayload } from '../lib/race';

const DEADLINE = '2026-11-22T04:00:00Z';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [now, setNow] = useState(Date.now());
  const [lastRace, setLastRace] = useState<LastRacePayload | null>(null);
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
    fetchLastResults().then(setLastRace);
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
      <div style={{ margin: '0 0 16px', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-soft)' }}>
        <img
          src="/header-banner.jpg"
          alt="2026 F1 Championship — Antonelli leading"
          style={{ width: '100%', display: 'block', imageRendering: 'pixelated' }}
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
      <div className="ios-card" style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 16, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{nextRace.name}</div>
          <div className="muted">{nextRace.circuit}</div>
          <div style={{ marginTop: 8, color: 'var(--ferrari)' }}>{formatDate(nextRace.date)}</div>
          <div style={{ marginTop: 16 }}>
            <div className="muted" style={{ fontSize: 13 }}>До закрытия приёма</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5, marginTop: 4 }}>{clock}</div>
          </div>
          <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
            Всего этапов: {RACES.length}
          </div>
        </div>
        <img
          src="/vegas-banner.jpg"
          alt="Las Vegas Grand Prix"
          style={{
            width: 160,
            height: 160,
            objectFit: 'cover',
            borderRadius: 16,
            imageRendering: 'pixelated',
            border: '1px solid var(--separator)',
          }}
        />
      </div>

      <div className="section-title">Быстрые действия</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Link to="/collection" className="ios-btn secondary" style={{ width: 'auto' }}>Коллекция</Link>
        <Link to="/leaderboard" className="ios-btn secondary" style={{ width: 'auto' }}>Таблица</Link>
      </div>

      {lastRace && lastRace.results.length > 0 && (
        <>
          <div className="section-title">Результаты последней гонки</div>
          <div className="ios-card">
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{lastRace.raceName}</div>
            <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
              {new Date(lastRace.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lastRace.results.slice(0, 5).map((r) => {
                const avatar = DRIVER_AVATAR[r.name];
                return (
                  <div key={r.position} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 22,
                      textAlign: 'center',
                      fontWeight: 700,
                      color: 'var(--accent)',
                      fontSize: 14,
                    }}>{r.position}</span>
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={r.name}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          imageRendering: 'pixelated',
                          objectFit: 'cover',
                          border: '1px solid var(--separator)',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: 'var(--bg-secondary)',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        imageRendering: 'pixelated',
                        border: '1px solid var(--separator)',
                      }}>
                        {driverInitials(r.name)}
                      </div>
                    )}
                    <div style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>{r.name}</div>
                    <div className="muted" style={{ fontSize: 13 }}>{r.points} очк.</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
