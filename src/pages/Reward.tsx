import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PF_CARDS } from '../data/cards';
import { fetchCardWallet, telegramRewardHeaders } from '../lib/cardTokens';

export default function Reward() {
  const [balance, setBalance] = useState<number | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const requestId = useRef<string | null>(null);

  useEffect(() => {
    fetchCardWallet()
      .then(wallet => setBalance(wallet.balance))
      .catch(error => setStatus(error.message));
  }, []);

  async function openCard() {
    const headers = telegramRewardHeaders();
    if (!headers || busy || !balance) return;

    setBusy(true);
    setStatus('');
    try {
      requestId.current ??= crypto.randomUUID();
      const response = await fetch('/api/score?wallet=cards', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: requestId.current }),
      });
      const data = await response.json();
      if (typeof data.balance === 'number') setBalance(data.balance);
      if (!response.ok) throw new Error(data.error);
      requestId.current = null;
      setCardId(data.cardId);
      setStatus('Карточка добавлена в коллекцию.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Не удалось открыть карточку.');
    } finally {
      setBusy(false);
    }
  }

  const card = PF_CARDS.find(item => item.id === cardId);

  return (
    <div className="pixel-page">
      <h2>Награда</h2>
      <div className="ios-card">
        <h3>Токены открытия · {balance ?? '—'}</h3>
        <p className="muted">Каждые 20 очков в таблице лидеров дают 1 токен. Открытие карточки стоит 1 токен.</p>
        {card && (
          <div style={{ textAlign: 'center', margin: '16px auto', maxWidth: 280 }}>
            <img src={card.image} alt={card.name} style={{ width: '100%', borderRadius: 16 }} />
            <strong>{card.name}</strong>
            <div className="muted">{card.rarity}</div>
          </div>
        )}
        {status && <p role="status">{status}</p>}
        <button className="ios-btn" onClick={openCard} disabled={busy || !balance}>
          {busy ? 'Открываем…' : 'Открыть за 1 токен'}
        </button>
      </div>
      <Link to="/collection" className="ios-btn secondary">Коллекция</Link>
    </div>
  );
}
