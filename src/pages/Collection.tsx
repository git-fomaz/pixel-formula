import { useState, useMemo } from 'react';
import { PF_CARDS } from '../data/cards';

type Rarity = 'Basic' | 'Rare' | 'Unique' | 'Masterpiece' | 'all';

function loadOwned(isDemo: boolean): Set<string> {
  try {
    const raw = localStorage.getItem('pf:rewards:v1');
    if (!raw) return new Set();
    const db = JSON.parse(raw);
    if (db.version !== 1 || !db.awards) return new Set();
    const ids = new Set<string>();
    for (const a of Object.values(db.awards) as any[]) {
      if (a && a.demo === isDemo && a.cardId) ids.add(a.cardId);
    }
    return ids;
  } catch {
    return new Set();
  }
}

const rarityColor: Record<string, string> = {
  Basic: '#bed0e6',
  Rare: '#ffd168',
  Unique: '#ca83ff',
  Masterpiece: '#ffb145',
};

export default function Collection() {
  const [view, setView] = useState<'catalog' | 'owned'>('catalog');
  const [mode, setMode] = useState<'live' | 'demo'>('live');
  const [rarity, setRarity] = useState<Rarity>('all');
  const [detail, setDetail] = useState<(typeof PF_CARDS)[0] | null>(null);

  const owned = useMemo(() => loadOwned(mode === 'demo'), [mode]);

  const filtered = PF_CARDS.filter(c => {
    if (rarity !== 'all' && c.rarity !== rarity) return false;
    if (view === 'owned' && !owned.has(c.id)) return false;
    return true;
  });

  const stats = useMemo(() => {
    const known = [...owned].filter(id => PF_CARDS.some(c => c.id === id));
    const counts: Record<string, number> = { Basic: 0, Rare: 0, Unique: 0, Masterpiece: 0 };
    for (const id of known) {
      const c = PF_CARDS.find(x => x.id === id);
      if (c) counts[c.rarity]++;
    }
    return { distinct: known.length, counts };
  }, [owned]);

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '18px 14px', color: '#f4eedc', fontFamily: 'monospace' }}>
      <p style={{ color: '#b2c4d9', fontSize: 12 }}>PIXEL FORMULA / COLLECTION</p>
      <h1 style={{ margin: '8px 0' }}>Коллекция карточек</h1>
      <p style={{ color: '#b2c4d9', fontSize: 12 }}>Каталог из {PF_CARDS.length} карточек. Просмотр не выдаёт наград.</p>

      <section style={{ background: '#10253e', border: '2px solid #7b8ea3', padding: 16, margin: '20px 0', boxShadow: '5px 5px #020915' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <label>Показать<br />
            <select value={view} onChange={e => setView(e.target.value as any)} style={sel}>
              <option value="catalog">Весь каталог</option>
              <option value="owned">Только полученные</option>
            </select>
          </label>
          <label>Режим<br />
            <select value={mode} onChange={e => setMode(e.target.value as any)} style={sel}>
              <option value="live">Настоящие награды</option>
              <option value="demo">Тестовые награды</option>
            </select>
          </label>
          <label>Редкость<br />
            <select value={rarity} onChange={e => setRarity(e.target.value as Rarity)} style={sel}>
              <option value="all">Все</option>
              <option>Basic</option>
              <option>Rare</option>
              <option>Unique</option>
              <option>Masterpiece</option>
            </select>
          </label>
        </div>
        <p style={{ color: '#e3c16b', marginTop: 12 }}>
          Получено: {stats.distinct} / {PF_CARDS.length} · Basic {stats.counts.Basic} · Rare {stats.counts.Rare} · Unique {stats.counts.Unique} · Masterpiece {stats.counts.Masterpiece}
        </p>
        {filtered.length === 0 && <p style={{ color: '#b2c4d9' }}>Нет карточек по выбранным условиям.</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14, marginTop: 12 }}>
          {filtered.map(card => (
            <button key={card.id} onClick={() => setDetail(card)} style={{
              padding: 0, border: `2px solid ${rarityColor[card.rarity]}`, background: '#142e4c', cursor: 'pointer', textAlign: 'left', color: '#f4eedc'
            }}>
              <img src={card.image} alt={card.name} style={{ width: '100%', display: 'block' }} />
              <span style={{ display: 'block', padding: 7, fontSize: 11 }}>
                {card.name}<br />
                <b style={{ color: rarityColor[card.rarity] }}>{card.rarity}</b>
                {owned.has(card.id) && <span style={{ marginLeft: 6, color: '#c8e889' }}>✓</span>}
              </span>
            </button>
          ))}
        </div>
      </section>

      {detail && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000c', display: 'grid', placeItems: 'center', zIndex: 50
        }} onClick={() => setDetail(null)}>
          <div style={{ background: '#10253e', border: '2px solid #e3c16b', padding: 12, width: 'min(92vw, 520px)', maxHeight: '90dvh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setDetail(null)} style={{ ...btn, marginBottom: 8 }}>Закрыть</button>
            <img src={detail.image} alt={detail.name} style={{ width: '100%', display: 'block' }} />
            <h2 style={{ margin: '12px 0 4px' }}>{detail.name}</h2>
            <p style={{ color: rarityColor[detail.rarity] }}>{detail.rarity}</p>
            <p style={{ color: '#b2c4d9', fontSize: 12 }}>{owned.has(detail.id) ? 'В коллекции' : 'Не получена'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

const sel: React.CSSProperties = { font: 'inherit', background: '#142e4c', color: '#f4eedc', border: '2px solid #7b8ea3', padding: 10, cursor: 'pointer' };
const btn: React.CSSProperties = { font: 'inherit', background: '#142e4c', color: '#f4eedc', border: '2px solid #7b8ea3', padding: 10, cursor: 'pointer' };
