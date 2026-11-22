import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PF_CARDS } from '../data/cards';
import { hasPrediction, fetchResultsForRound, CURRENT_RACE, formatCountdown, type LastRacePayload } from '../lib/race';

type Rarity = 'Basic' | 'Rare' | 'Unique' | 'Masterpiece';

function odds(h: number) {
  return {
    Basic: Math.max(0, Math.round((86.9 - 3.18 * h) * 100) / 100),
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
      if (pool.length === 0) break;
      return pool[Math.floor(random() * pool.length)];
    }
  }
  return PF_CARDS.find(c => c.rarity === 'Basic') || PF_CARDS[0];
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

function getTelegramUserId(): string | null {
  try {
    const tg = (window as any).Telegram?.WebApp;
    const id = tg?.initDataUnsafe?.user?.id;
    return id ? String(id) : null;
  } catch {
    return null;
  }
}

export default function Reward() {
  const [predicted, setPredicted] = useState(false);
  const [results, setResults] = useState<LastRacePayload | null>(null);
  const [loadingResults, setLoadingResults] = useState(true);
  const [racePoints, setRacePoints] = useState<number | null>(null);
  const [opened, setOpened] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [now, setNow] = useState(Date.now());

  const raceKey = `race:${CURRENT_RACE.id}`;

  useEffect(() => {
    setPredicted(hasPrediction());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!predicted) {
      setLoadingResults(false);
      return;
    }
    setLoadingResults(true);
    fetchResultsForRound(CURRENT_RACE.round)
      .then(setResults)
      .finally(() => setLoadingResults(false));
  }, [predicted]);

  useEffect(() => {
    const userId = getTelegramUserId();
    if (!userId || !results) return;

    fetch(`/api/score?userId=${userId}&raceId=${CURRENT_RACE.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && typeof data.points === 'number') {
          setRacePoints(data.points);
        } else {
          setRacePoints(0);
        }
      })
      .catch(() => setRacePoints(0));

    const db = loadDb();
    if (db.awards[raceKey]) {
      setOpened(db.awards[raceKey]);
    }
  }, [results, raceKey]);

  const h = useMemo(() => {
    if (racePoints === null) return 0;
    return Math.min(5, racePoints / 10);
  }, [racePoints]);

  const rates = useMemo(() => odds(h), [h]);

  const openReward = () => {
    if (busy || opened || racePoints === null) return;
    setBusy(true);
    setStatus('Открываем…');
    setTimeout(() => {
      const card = choose(h);
      const award = {
        cardId: card.id,
        raceId: CURRENT_RACE.id,
        points: racePoints,
        at: new Date().toISOString(),
      };
      saveAward(raceKey, award);
      setOpened(award);
      setStatus('Карточка сохранена');
      setBusy(false);
    }, 700);
  };

  const card = opened ? PF_CARDS.find(c => c.id === opened.cardId) : null;
  const resultsReady = !!results?.results?.length;
  const nextMs = Date.parse(CURRENT_RACE.start) - now;

  if (!predicted) {
    return (
      <div className="pixel-page">
        <h2>Награда</h2>
        <div className="ios-card" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏁</div>
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Сначала сделай прогноз</div>
          <p className="muted" style={{ margin: '0 0 20px' }}>
            Страница награды открывается только после того, как ты сделаешь прогноз на ближайшую гонку.
          </p>
          <Link to="/predict" className="ios-btn">Сделать прогноз</Link>
        </div>
      </div>
    );
  }

  if (!loadingResults && !resultsReady) {
    return (
      <div className="pixel-page">
        <h2>Награда</h2>
        <div className="ios-card" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Ждем результаты гонки</div>
          <p className="muted" style={{ margin: '0 0 16px' }}>
            Прогноз принят. Как только результаты подтянутся — сможешь открыть награду.
          </p>
          {nextMs > 0 && (
            <div className="muted" style={{ fontSize: 13 }}>
              До начала следующей гонки: {formatCountdown(nextMs)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pixel-page">
      <h2>Награда</h2>

      <div className="ios-card">
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{results?.raceName || CURRENT_RACE.name}</div>
        <div className="muted" style={{ fontSize: 14, marginBottom: 12 }}>
          Очки за гонку: <b style={{ color: 'var(--accent-red)' }}>{racePoints ?? '…'}</b>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {(['Basic', 'Rare', 'Unique', 'Masterpiece'] as Rarity[]).map(r => (
            <div key={r} style={{
              background: 'var(--fill-tertiary)',
              borderRadius: 12,
              padding: '10px 12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 12, color: rarityColor[r], fontWeight: 600 }}>{r}</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{rates[r].toFixed(1)}%</div>
            </div>
          ))}
        </div>

        <div style={{
          minHeight: 280,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}>
          {!card && (
            <div style={{
              width: 200,
              height: 280,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #c41e3a 0%, #8e8e93 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: 1,
              animation: busy ? 'pulse 0.6s ease-in-out infinite' : undefined,
            }}>
              <div>PF</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>REWARD</div>
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

        <button
          onClick={openReward}
          disabled={!!opened || busy || racePoints === null}
          className="ios-btn"
          style={{ opacity: opened || busy ? 0.5 : 1 }}
        >
          {opened ? 'Награда получена' : busy ? 'Открываем…' : 'Получить награду'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Link to="/predict" className="ios-btn secondary">К прогнозу</Link>
        <Link to="/collection" className="ios-btn secondary">Коллекция</Link>
      </div>
    </div>
  );
}
