import { useState, useMemo, useEffect } from 'react';
import { PF_CARDS } from '../data/cards';

type Rarity = 'Basic' | 'Rare' | 'Unique' | 'Masterpiece' | 'all';

function loadOwned(): Set<string> {
  const ids = new Set<string>();
  // Limited beta card — always owned for anyone who opens the app
  ids.add('25_YOU_Legendary_Beta');
  try {
    const raw = localStorage.getItem('pf:rewards:v1');
    if (!raw) return ids;
    const db = JSON.parse(raw);
    if (db.version !== 1 || !db.awards) return ids;
    for (const a of Object.values(db.awards) as any[]) {
      if (a && a.demo === false && a.cardId) ids.add(a.cardId);
    }
    return ids;
  } catch {
    return ids;
  }
}

const rarityColor: Record<string, string> = {
  Basic: '#8e8e93',
  Rare: '#ffd60a',
  Unique: '#bf5af2',
  Masterpiece: '#ff9f0a',
  Legendary: '#ffd700',
};

export default function Collection() {
  const [rarity, setRarity] = useState<Rarity>('all');
  const [detail, setDetail] = useState<(typeof PF_CARDS)[0] | null>(null);
  const [bonusCardId, setBonusCardId] = useState<string | null>(null);

  const owned = useMemo(() => {
    const ids = loadOwned();
    if (bonusCardId) ids.add(bonusCardId);
    return ids;
  }, [bonusCardId]);

  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      const userId = tg?.initDataUnsafe?.user?.id;
      if (!userId) return;
      fetch(`/api/award?userId=${userId}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.cardId) setBonusCardId(data.cardId);
        })
        .catch(() => {});
    } catch {}
  }, []);

  const filtered = PF_CARDS.filter(c => {
    if (!owned.has(c.id)) return false;
    if (rarity !== 'all' && c.rarity !== rarity) return false;
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
    <div className="pixel-page">
      <h2>Коллекция</h2>
      <p className="muted">Только полученные карточки</p>

      <div className="ios-card">
        <select value={rarity} onChange={e => setRarity(e.target.value as Rarity)}>
          <option value="all">Все редкости</option>
          <option>Basic</option>
          <option>Rare</option>
          <option>Unique</option>
          <option>Masterpiece</option>
          <option>Legendary</option>
        </select>
        <p style={{ color: 'var(--ferrari)', marginTop: 12, marginBottom: 0, fontWeight: 600 }}>
          Получено: {stats.distinct}
        </p>
      </div>

      {filtered.length === 0 && <p className="muted">Пока нет полученных карточек.</p>}

      <div className="card-grid">
        {filtered.map(card => (
          <button key={card.id} onClick={() => setDetail(card)} className="card-item" style={{ borderColor: rarityColor[card.rarity], cursor: 'pointer', textAlign: 'left', color: 'inherit', padding: 0 }}>
            <img src={card.image} alt={card.name} />
            <div className="meta">
              <div style={{ fontWeight: 600 }}>{card.name}</div>
              <div style={{ color: rarityColor[card.rarity], fontSize: 12 }}>{card.rarity}</div>
            </div>
          </button>
        ))}
      </div>

      {detail && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 200,
          backdropFilter: 'blur(8px)',
        }} onClick={() => setDetail(null)}>
          <div className="ios-card" style={{ width: 'min(92vw, 400px)', maxHeight: '85dvh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <img src={detail.image} alt={detail.name} style={{ width: '100%', borderRadius: 12, display: 'block' }} />
            <h2 style={{ margin: '16px 0 4px' }}>{detail.name}</h2>
            <p style={{ color: rarityColor[detail.rarity], margin: 0 }}>{detail.rarity}</p>
            {detail.id === '25_YOU_Legendary_Beta' && (
              <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.4 }}>
                Лимитированная карта бета-тестеров приложения
              </p>
            )}
            {bonusCardId && detail.id === bonusCardId && (
              <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.4 }}>
                За первый прогноз
              </p>
            )}
            <button onClick={() => setDetail(null)} className="ios-btn secondary" style={{ marginTop: 12 }}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}
