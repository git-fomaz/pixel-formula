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
  Basic: '#c4d6ec',
  Rare: '#ffd35b',
  Unique: '#c775ff',
  Masterpiece: '#ffb52e',
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
      setStatus('Карточка сохранена. Повторное открытие не меняет награду.');
      setBusy(false);
    }, 700);
  };

  const card = opened ? PF_CARDS.find(c => c.id === opened.cardId) : null;
  const awards = useMemo(() => {
    const db = loadDb();
    return Object.values(db.awards).filter((a: any) => a && a.demo === true);
  }, [opened]);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '18px 16px', color: '#f5eedc', fontFamily: 'monospace' }}>
      <div style={{ color: '#e7c764' }}>PIXEL FORMULA / REWARDS</div>
      <h1 style={{ fontSize: 'clamp(24px,7vw,38px)', margin: '12px 0' }}>Награда за гонку</h1>
      <p style={{ color: '#acc0d7', fontSize: 13 }}>Локальный прототип. Результаты и выдача пока не подтверждаются сервером.</p>

      <section style={panel}>
        <h2>Демо открытия</h2>
        <p style={{ color: '#acc0d7', fontSize: 13 }}>Тестовые награды хранятся отдельно от наград за этапы.</p>
        <label>Точные позиции<br />
          <select value={hits} onChange={e => setHits(Number(e.target.value))} style={sel}>
            {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n} из 5</option>)}
          </select>
        </label>
        <button onClick={startDemo} style={btn}>Начать новый демо-заезд</button>
      </section>

      {current && (
        <section style={panel}>
          <h2>{current.raceName}</h2>
          <p>Точно угадано: {current.hits} из 5.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '12px 0' }}>
            {(['Basic','Rare','Unique','Masterpiece'] as Rarity[]).map(r => (
              <div key={r} style={{ border: '1px solid #62758c', padding: 12, color: rarityColor[r] }}>
                {r}<strong style={{ display: 'block', marginTop: 8, fontSize: 23 }}>{rates[r].toLocaleString('ru-RU', { maximumFractionDigits: 2 })}%</strong>
              </div>
            ))}
          </div>
          <p style={{ color: '#acc0d7', fontSize: 13 }}>Сначала выбирается редкость, затем с равным шансом — одна из карточек этой категории. Повторы возможны.</p>

          <div style={{ display: 'grid', placeItems: 'center', minHeight: 280, padding: '20px 0' }}>
            {!card && (
              <div style={{
                width: 'min(240px,70vw)', aspectRatio: '2/3', border: '6px double #f1e8cf',
                background: 'repeating-linear-gradient(45deg,#102b4d 0 18px,#173b62 18px 36px)',
                display: 'grid', placeContent: 'center', textAlign: 'center', boxShadow: '8px 8px #020914',
                fontSize: 28, lineHeight: 1.5, animation: busy ? 'shake .22s infinite' : undefined,
              }}>
                PF<br />RACE<br />REWARD
              </div>
            )}
            {card && (
              <div style={{ textAlign: 'center', color: rarityColor[card.rarity] }}>
                <img src={card.image} alt={card.name} style={{
                  display: 'block', width: 'min(100%,350px)', height: 'auto',
                  border: `2px solid ${rarityColor[card.rarity]}`,
                  boxShadow: `0 0 25px ${rarityColor[card.rarity]}66`,
                }} />
                <h2>{card.name}</h2>
                <p>{card.rarity}</p>
              </div>
            )}
          </div>
          <div style={{ minHeight: 24, color: '#f3cc77' }}>{status}</div>
          <button onClick={openReward} disabled={!!opened || busy} style={{ ...btn, opacity: opened || busy ? 0.5 : 1 }}>
            {opened ? 'Награда получена' : 'Открыть награду'}
          </button>
        </section>
      )}

      <section style={panel}>
        <h2>Демо-коллекция</h2>
        {awards.length === 0 && <p style={{ color: '#acc0d7' }}>Здесь появятся открытые карточки.</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {awards.map((a: any, i) => {
            const c = PF_CARDS.find(x => x.id === a.cardId);
            if (!c) return null;
            return (
              <div key={i}>
                <img src={c.image} alt={c.name} style={{ width: '100%', display: 'block' }} />
                <p style={{ fontSize: 11, margin: '5px 0' }}>{c.name} / {c.rarity}</p>
              </div>
            );
          })}
        </div>
      </section>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link to="/predict" style={btn}>К прогнозу</Link>
        <Link to="/collection" style={{ ...btn, background: '#142e4c', color: '#f5eedc' }}>Коллекция</Link>
      </div>
    </div>
  );
}

const panel: React.CSSProperties = { background: '#10253e', border: '2px solid #72869d', padding: 18, margin: '18px 0', boxShadow: '5px 5px #020914' };
const btn: React.CSSProperties = { padding: '12px 16px', border: '2px solid #f1e8cf', background: '#e7c764', color: '#071426', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: 'inherit', minHeight: 48 };
const sel: React.CSSProperties = { background: '#071426', color: '#fff', padding: 8, width: '100%', marginBottom: 10, font: 'inherit' };
