import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PF_CARDS } from '../data/cards';

type Rarity = 'Basic' | 'Rare' | 'Unique' | 'Masterpiece';

function odds(h: number) {
  return {
    Basic: Math.round((86.9 - 3.18 * h) * 100) / 100,
    Rare: 10 + 2 * h,
    Unique: 3 + 0.6 * h,
    Masterpiece: Math.round((0.1 + 0.58 * h) * 100) / 100,
  };
}

function random() {
  const n = new Uint32Array(1);
  crypto.getRandomValues(n);
  return n[0] / 4294967296;
}

function choose(h: number) {
  const rates = odds(h);
  const roll = random() * 100;
  let sum = 0;
  for (const rarity of ['Basic', 'Rare', 'Unique', 'Masterpiece'] as Rarity[]) {
    sum += rates[rarity];
    if (roll < sum) {
      const pool = PF_CARDS.filter(c => c.rarity === rarity);
      return pool[Math.floor(random() * pool.length)];
    }
  }
  return PF_CARDS[0];
}

const KEY = 'pf:rewards:v1';

function loadDb() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { version: 1, awards: {} as Record<string, any> };
    const data = JSON.parse(raw);
    if (data.version !== 1 || !data.awards) return { version: 1, awards: {} };
    return data;
  } catch {
    return { version: 1, awards: {} };
  }
}

function saveAward(key: string, award: any) {
  const db = loadDb();
  db.awards[key] = award;
  localStorage.setItem(KEY, JSON.stringify(db));
}

const rarityColor: Record<string, string> = {
  Basic: '#8e8e93',
  Rare: '#ffd60a',
  Unique: '#bf5af2',
  Masterpiece: '#ff9f0a',
};

export default function Reward() {
  const [hits, setHits] = useState(3);
  const [current, setCurrent] = useState<{ key: string; raceName: string; hits: number; demo: boolean } | null>(null);
  const [opened, setOpened] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    try {
      const prev = JSON.parse(localStorage.getItem('pf:reward:demo-current') || 'null');
      if (prev) {
        setCurrent(prev);
        setHits(prev.hits);
        const db = loadDb();
        if (db.awards[prev.key]) setOpened(db.awards[prev.key]);
      }
    } catch {}
  }, []);

  const rates = useMemo(() => current ? odds(current.hits) : odds(hits), [current, hits]);

  const startDemo = () => {
    const next = { demo: true, key: 'demo:' + Date.now() + ':' + random(), raceName: 'Демо-заезд', hits };
    localStorage.setItem('pf:reward:demo-current', JSON.stringify(next));
    setCurrent(next);
    setOpened(null);
    setStatus('');
  };

  const openReward = () => {
    if (!current || busy || opened) return;
    setBusy(true);
    setStatus('Открываем…');
    setTimeout(() => {
      const card = choose(current.hits);
      const award = { cardId: card.id, demo: true, at: new Date().toISOString() };
      saveAward(current.key, award);
      setOpened(award);
      setStatus('Карточка сохранена');
      setBusy(false);
    }, 700);
  };

  const card = opened ? PF_CARDS.find(c => c.id === opened.cardId) : null;
  const awards = useMemo(() => {
    const db = loadDb();
    return Object.values(db.awards).filter((a: any) => a && a.demo === true);
  }, [opened]);

  return (
    <div className="pixel-page">
      <h2>Награда</h2>
      <p className="muted">Локальный прототип. Результаты пока не подтверждаются сервером.</p>

      <div className="ios-card">
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Демо открытия</div>
        <p className="muted" style={{ marginTop: 0 }}>Тестовые награды хранятся отдельно от наград за этапы.</p>
        <label className="muted" style={{ fontSize: 13 }}>Точные позиции</label>
        <select value={hits} onChange={e => setHits(Number(e.target.value))} style={{ marginTop: 6, marginBottom: 12 }}>
          {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n} из 5</option>)}
        </select>
        <button onClick={startDemo} className="ios-btn">Начать новый демо-заезд</button>
      </div>

      {current && (
        <div className="ios-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700 }}>{current.raceName}</div>
            <span style={{
              background: 'rgba(10, 132, 255, 0.2)',
              color: 'var(--accent)',
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
            }}>{current.hits} / 5</span>
          </div>

          <div className="section-title">Шансы</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(['Basic','Rare','Unique','Masterpiece'] as Rarity[]).map(r => (
              <div key={r} style={{
                background: 'var(--bg-secondary)',
                borderRadius: 12,
                padding: 12,
                color: rarityColor[r],
              }}>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{r}</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                  {rates[r].toLocaleString('ru-RU', { maximumFractionDigits: 2 })}%
                </div>
              </div>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 12, marginBottom: 16, fontSize: 13 }}>
            Сначала выбирается редкость, затем с равным шансом — одна из карточек этой категории. Повторы возможны.
          </p>

          <div style={{ display: 'grid', placeItems: 'center', minHeight: 260, margin: '8px 0' }}>
            {!card && (
              <div style={{
                width: 'min(220px, 70vw)',
                aspectRatio: '2/3',
                borderRadius: 20,
                background: 'linear-gradient(145deg, #2c2c2e, #1c1c1e)',
                border: '1px solid var(--separator)',
                display: 'grid',
                placeContent: 'center',
                textAlign: 'center',
                boxShadow: 'var(--shadow)',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 1,
                animation: busy ? 'pulse 0.6s ease-in-out infinite' : undefined,
              }}>
                <div>PF</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--label-secondary)', marginTop: 4 }}>REWARD</div>
              </div>
            )}
            {card && (
              <div style={{ textAlign: 'center', maxWidth: 280 }}>
                <img src={card.image} alt={card.name} style={{
                  width: '100%',
                  borderRadius: 16,
                  border: `2px solid ${rarityColor[card.rarity]}`,
                  boxShadow: `0 8px 32px ${rarityColor[card.rarity]}40`,
                  display: 'block',
                }} />
                <div style={{ fontWeight: 700, fontSize: 20, marginTop: 12 }}>{card.name}</div>
                <div style={{ color: rarityColor[card.rarity], fontWeight: 600, marginTop: 2 }}>{card.rarity}</div>
              </div>
            )}
          </div>

          {status && <p style={{ textAlign: 'center', color: 'var(--accent-green)', fontWeight: 500, margin: '8px 0' }}>{status}</p>}

          <button onClick={openReward} disabled={!!opened || busy} className="ios-btn" style={{ opacity: opened || busy ? 0.5 : 1 }}>
            {opened ? 'Награда получена' : busy ? 'Открываем…' : 'Открыть награду'}
          </button>
        </div>
      )}

      <div className="section-title">Демо-коллекция</div>
      <div className="ios-card">
        {awards.length === 0 && <p className="muted" style={{ margin: 0 }}>Здесь появятся открытые карточки.</p>}
        <div className="card-grid">
          {awards.map((a: any, i) => {
            const c = PF_CARDS.find(x => x.id === a.cardId);
            if (!c) return null;
            return (
              <div key={i} className="card-item">
                <img src={c.image} alt={c.name} />
                <div className="meta">
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ color: rarityColor[c.rarity], fontSize: 12 }}>{c.rarity}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Link to="/predict" className="ios-btn secondary">К прогнозу</Link>
        <Link to="/collection" className="ios-btn secondary">Коллекция</Link>
      </div>
    </div>
  );
}
