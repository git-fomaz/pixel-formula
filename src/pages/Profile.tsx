import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PF_CARDS } from '../data/cards';
import type { ThemeMode } from '../lib/theme';

import { fetchCardWallet, type CardWallet } from '../lib/cardTokens';

function loadSummary(cardIds: string[]) {
  try {
    const db = JSON.parse(localStorage.getItem('pf:rewards:v1') || '{}');
    const legacy = db.version === 1 ? Object.values(db.awards || {}) as any[] : [];
    const ids = [...cardIds, ...legacy.filter(award => award && award.demo !== true).map(award => award.cardId)];
    const known = ids.filter(id => PF_CARDS.some(card => card.id === id));
    const distinct = new Set(known).size;
    const counts: Record<string, number> = { Basic: 0, Rare: 0, Unique: 0, Masterpiece: 0 };
    for (const a of known) {
      const c = PF_CARDS.find(x => x.id === a);
      if (c) counts[c.rarity]++;
    }
    return { total: known.length, distinct, counts };
  } catch {
    return { total: 0, distinct: 0, counts: { Basic: 0, Rare: 0, Unique: 0, Masterpiece: 0 } };
  }
}

const rarityColor: Record<string, string> = {
  Basic: '#8e8e93',
  Rare: '#ffd60a',
  Unique: '#bf5af2',
  Masterpiece: '#ff9f0a',
};

export default function Profile({ theme, onThemeChange }: { theme: ThemeMode; onThemeChange: (theme: ThemeMode) => void }) {
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [wallet, setWallet] = useState<CardWallet | null>(null);
  const rewards = useMemo(() => loadSummary(wallet?.cardIds ?? []), [wallet]);

  useEffect(() => {
    fetchCardWallet().then(setWallet).catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
        const u = tg.initDataUnsafe.user;
        setNickname(u.first_name || u.username || '');
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const displayName = user ? (user.first_name || user.username || 'Игрок') : 'Игрок';
  const photoUrl = user?.photo_url;

  const saveNickname = async () => {
    if (!user?.id || !nickname.trim()) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: String(user.id), name: nickname.trim() }),
      });
      if (res.ok) setSaved(true);
    } catch {}
    setSaving(false);
  };

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

      {user && (
        <div className="ios-card" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Никнейм в таблице</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={24}
              placeholder="Как тебя показывать"
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid var(--separator)',
                fontSize: 16,
                outline: 'none',
              }}
            />
            <button
              onClick={saveNickname}
              disabled={saving || !nickname.trim()}
              className="ios-btn"
              style={{ width: 'auto', padding: '0 16px' }}
            >
              {saving ? '...' : 'Сохранить'}
            </button>
          </div>
          {saved && (
            <div style={{ marginTop: 8, color: 'var(--ferrari)', fontSize: 13 }}>
              Никнейм обновлён
            </div>
          )}
        </div>
      )}

      <div className="section-title">Оформление</div>
      <div className="ios-card">
        <div style={{ fontWeight: 600 }}>Тема приложения</div>
        <p className="muted" style={{ margin: '4px 0 12px', fontSize: 13 }}>
          Выбери удобный вид Pixel Formula. Настройка сохранится на этом устройстве.
        </p>
        <div className="theme-switch" role="group" aria-label="Тема приложения">
          <button type="button" className={`theme-option${theme === 'light' ? ' is-active' : ''}`}
            aria-pressed={theme === 'light'} onClick={() => onThemeChange('light')}>
            <span aria-hidden="true">☀️</span> Светлая
          </button>
          <button type="button" className={`theme-option${theme === 'dark' ? ' is-active' : ''}`}
            aria-pressed={theme === 'dark'} onClick={() => onThemeChange('dark')}>
            <span aria-hidden="true">🌙</span> Тёмная
          </button>
        </div>
      </div>

      <div className="ios-card">
        <strong>Токены открытия · {wallet?.balance ?? '—'}</strong>
        <p className="muted">1 токен за каждые 20 очков в таблице лидеров.</p>
        <Link to="/reward" className="ios-btn secondary">Открыть карточку</Link>
      </div>

      <div className="section-title">Статистика</div>
      <div className="stat-row">
        <div className="stat-box"><strong>{wallet?.points ?? '—'}</strong><small>Очки</small></div>
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
