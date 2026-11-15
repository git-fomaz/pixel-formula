import { useState, useEffect } from 'react';
import { calculateTeamPoints } from '../data/f1Data';

const TEAM_KEY = 'pixel-formula-team';

const MOCK_PLAYERS = [
  { name: 'PixelPilot', points: 142 },
  { name: 'NitroNerd', points: 128 },
  { name: 'GridGhost', points: 115 },
];

export default function Leaderboard() {
  const [myPoints, setMyPoints] = useState(0);
  const [hasTeam, setHasTeam] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(TEAM_KEY);
    if (stored) {
      try {
        const ids: number[] = JSON.parse(stored);
        if (ids.length === 2) {
          setHasTeam(true);
          setMyPoints(calculateTeamPoints(ids));
        }
      } catch {}
    }
  }, []);

  const rows = [
    ...MOCK_PLAYERS,
    { name: 'Ты', points: hasTeam ? myPoints : 0 },
  ]
    .sort((a, b) => b.points - a.points)
    .map((row, i) => ({ ...row, pos: i + 1 }));

  return (
    <div className="pixel-page">
      <h2>Таблица лидеров</h2>
      <div className="pixel-card">
        <table className="pixel-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Игрок</th>
              <th>Очки</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className={row.name === 'Ты' ? 'highlight' : ''}>
                <td>{row.pos}</td>
                <td>{row.name}</td>
                <td>{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!hasTeam && (
          <p style={{ marginTop: 12, fontSize: '0.65rem', color: '#8888aa' }}>
            Выбери состав, чтобы появиться в таблице
          </p>
        )}
      </div>
    </div>
  );
}
