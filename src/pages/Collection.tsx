import { PF_CARDS } from '../data/cards';

export default function Collection() {
  return (
    <div className="pixel-page">
      <h2>Коллекция карточек</h2>
      <p>Каталог из {PF_CARDS.length} карточек</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
        {PF_CARDS.map(card => (
          <div key={card.id} className="pixel-card" style={{ padding: 0, overflow: 'hidden' }}>
            <img src={card.image} alt={card.name} style={{ width: '100%', display: 'block' }} />
            <div style={{ padding: 8, fontSize: '0.65rem' }}>
              <strong>{card.name}</strong><br />
              <span style={{ color: '#ffd168' }}>{card.rarity}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
