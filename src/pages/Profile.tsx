import { useMemo } from 'react';
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

const rarityStyle: Record<string, React.CSSProperties> = {
  Basic: { color: '#c8d8e9', borderColor: '#c8d8e9' },
  Rare: { color: '#ffd069', borderColor: '#ffd069' },
  Unique: { color: '#d08bff', borderColor: '#d08bff' },
  Masterpiece: { color: '#ffac46', borderColor: '#ffac46' },
};

export default function Profile() {
  const rewards = useMemo(loadSummary, []);
  const pts = useMemo(loadPoints, []);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px 16px 26px', color: '#f4eedc', fontFamily: "'Courier New', monospace", lineHeight: 1.5 }}>
      <div style={{ fontSize: 11, letterSpacing: 2, color: '#b3c6df' }}>PIXEL FORMULA / PROFILE</div>
      <h1 style={{ fontSize: 'clamp(26px,7vw,40px)', margin: '8px 0 14px' }}>Профиль</h1>

      <section style={{ ...panel, background: 'linear-gradient(135deg,#193956,#10253e)' }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', margin: '18px 0' }}>
          <div style={{ flex: '0 0 82px', height: 82, display: 'grid', placeItems: 'center', border: '3px solid #edd38d', background: '#09203a', fontSize: 30, color: '#edcf7e', boxShadow: '4px 4px #030b16' }}>
            PF
          </div>
          <div>
            <h2 style={{ margin: 0 }}>Игрок</h2>
            <p style={{ color: '#afc1d7', fontSize: 12, margin: '4px 0' }}>Telegram не подключён</p>
            <span style={{ display: 'inline-block', padding: '5px 9px', border: '1px solid #c8e889', color: '#c8e889', fontSize: 11 }}>BETA</span>
          </div>
        </div>
        <p style={{ borderLeft: '3px solid #e2c16b', background: '#091b30', fontSize: 12, padding: 12 }}>
          Данные хранятся локально в браузере. Подключение Telegram Mini App сохранит прогресс на сервере.
        </p>
      </section>

      <section style={panel}>
        <h2>Статистика</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          <div style={stat}><strong>{pts.total}</strong><small>ОЧКИ</small><p>За {pts.races} гонок</p></div>
          <div style={stat}><strong>{rewards.distinct} / {PF_CARDS.length}</strong><small>КАРТОЧКИ</small><p>Уникальных в коллекции</p></div>
          <div style={stat}><strong>{rewards.total}</strong><small>НАГРАД</small><p>Всего получено</p></div>
          <div style={stat}><strong>—</strong><small>МЕСТО</small><p>В общем зачёте</p></div>
        </div>
      </section>

      <section style={panel}>
        <h2>Коллекция по редкости</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 12 }}>
          {(['Basic', 'Rare', 'Unique', 'Masterpiece'] as const).map(r => (
            <div key={r} style={{ padding: '12px 5px', border: '1px solid', textAlign: 'center', ...rarityStyle[r] }}>
              <strong style={{ fontSize: 25, display: 'block' }}>{rewards.counts[r]}</strong>
              <span style={{ fontSize: 10 }}>{r}</span>
            </div>
          ))}
        </div>
        <div style={{ height: 12, border: '1px solid #607c96', marginTop: 12, background: '#07172c' }}>
          <div style={{ height: '100%', background: '#e2c16b', width: `${(rewards.distinct / PF_CARDS.length) * 100}%` }} />
        </div>
      </section>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
        <Link to="/collection" style={button}>Открыть коллекцию</Link>
        <Link to="/predict" style={{ ...button, background: '#142e4c', color: '#f4eedc' }}>Сделать прогноз</Link>
        <Link to="/calendar" style={{ ...button, background: '#142e4c', color: '#f4eedc' }}>Календарь</Link>
      </div>
    </div>
  );
}

const panel: React.CSSProperties = { border: '2px solid #7b8ea3', background: '#10253e', padding: 20, marginTop: 20, boxShadow: '5px 5px #020915' };
const stat: React.CSSProperties = { border: '1px solid #4f6a86', padding: 14 };
const button: React.CSSProperties = { font: "700 13px 'Courier New', monospace", minHeight: 48, padding: '12px 14px', border: '2px solid #eadfc5', background: '#e2c16b', color: '#07172c', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', cursor: 'pointer', textAlign: 'center', flex: 1 };
