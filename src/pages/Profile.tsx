import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PF_CARDS } from '../data/cards';

function loadSummary() {
  try {
    const raw = localStorage.getItem('pf:rewards:v1');
    if (!raw) return { total: 0, distinct: 0, counts: { Basic: 0, Rare: 0, Unique: 0, Masterpiece: 0 } };
    const db = JSON.parse(raw);
    if (db.version !== 1 || !db.awards) return { total: 0, distinct: 0, counts: { Basic: 0, Rare: 0, Unique: 0, Masterpiece: 0 } };
    const awards = Object.values(db.awards) as any[];
    const live = awards.filter(a => a && a.demo === false);
    const known = live.filter(a => PF_CARDS.some(c => c.id === a.cardId));
    const distinct = new Set(known.map(a => a.cardId)).size;
    const counts: Record<string, number> = { Basic: 0, Rare: 0, Unique: 0, Masterpiece: 0 };
    for (const a of known) {
      const c = PF_CARDS.find(x => x.id === a.cardId);
      if (c) counts[c.rarity]++;
    }
    return { total: known.length, distinct, counts };
  } catch {
    return { total: 0, distinct: 0, counts: { Basic: 0, Rare: 0, Unique: 0, Masterpiece: 0 } };
  }
}

function loadPoints() {
  let total = 0;
  let races = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('pf:race-result:v1:')) {
        const v = JSON.parse(localStorage.getItem(k) || '{}');
        if (typeof v.points === 'number') {
          total += v.points;
          races++;
        }
      }
    }
  } catch {}
  return { total, races };
}

const rarityColor: Record<string, string> = {
  Basic: '#8e8e93',
  Rare: '#ffd60a',
  Unique: '#bf5af2',
  Masterpiece: '#ff9f0a',
};

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const rewards = useMemo(loadSummary, []);
  const pts = useMemo(loadPoints, []);

  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const displayName = user ? (user.first_name || user.username || 'Игрок') : 'Игрок';
  const photoUrl = user?.photo_url;

  return (
    <div className="pixel-page">
      <h2>Профиль</h2>

      <div className="ios-card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={displayName}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              objectFit: 'cover',
              border: '2px solid var(--separator)',
            }}
          />
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: 32, background: 'var(--ferrari)',
            display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 700, color: '#fff',
          }}>{displayName.charAt(0).toUpperCase()}</div>
        )}
        <div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>{displayName}</div>
          <div className="muted">{user ? (user.username ? `@${user.username}` : 'Telegram') : 'Telegram не подключён'}</div>
          <span style={{
            display: 'inline-block', marginTop: 4, padding: '2px 8px',
            background: 'rgba(192, 57, 43, 0.15)', color: 'var(--ferrari)',
            borderRadius: 999, fontSize: 12, fontWeight: 600,
          }}>BETA</span>
        </div>
      </div>

      <div className="section-title">Статистика</div>
      <div className="stat-row">
        <div className="stat-box"><strong>{pts.total}</strong><small>Очки</small></div>
        <div className="stat-box"><strong>{rewards.distinct}/{PF_CARDS.length}</strong><small>Карточки</small></div>
        <div className="stat-box"><strong>{rewards.total}</strong><small>Наград</small></div>
        <div className="stat-box"><strong>—</strong><small>Место</small></div>
      </div>

      <div className="section-title">Коллекция по редкости</div>
      <div className="ios-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, textAlign: 'center' }}>
          {(['Basic', 'Rare', 'Unique', 'Masterpiece'] as const).map(r => (
            <div key={r}>
              <div style={{ fontSize: 22, fontWeight: 700, color: rarityColor[r] }}>{rewards.counts[r]}</div>
              <div style={{ fontSize: 11, color: 'var(--label-secondary)' }}>{r}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 6, background: 'var(--fill)', borderRadius: 3, marginTop: 16, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'var(--ferrari)', width: `${(rewards.distinct / PF_CARDS.length) * 100}%`, borderRadius: 3 }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
        <Link to="/collection" className="ios-btn">Коллекция</Link>
        <Link to="/predict" className="ios-btn secondary">Прогноз</Link>
      </div>
    </div>
  );
}
