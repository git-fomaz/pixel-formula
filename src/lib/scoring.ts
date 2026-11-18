export interface ScoreResult {
  rulesVersion: string;
  positions: Array<{
    position: number;
    driver: string;
    actual: string;
    matched: boolean;
    points: number;
  }>;
  exactHits: number;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
}

const POINTS = [15, 12, 10, 8, 8];
const BONUS = [0, 0, 2, 5, 10, 20];

export function calculateScore(picks: string[], actual: string[], multiplier = 1): ScoreResult {
  for (const arr of [picks, actual]) {
    if (!Array.isArray(arr) || arr.length !== 5 || new Set(arr).size !== 5 || arr.some(v => typeof v !== 'string' || !v.trim())) {
      throw new Error('Нужны пять разных пилотов');
    }
  }

  const positions = picks.map((driver, i) => ({
    position: i + 1,
    driver,
    actual: actual[i],
    matched: driver === actual[i],
    points: driver === actual[i] ? POINTS[i] * multiplier : 0,
  }));

  const exactHits = positions.filter(x => x.matched).length;
  const basePoints = positions.reduce((s, x) => s + x.points, 0);
  const bonusPoints = BONUS[exactHits] * multiplier;

  return {
    rulesVersion: multiplier === 1 ? 'top5-v1' : 'top5-q-v1',
    positions,
    exactHits,
    basePoints,
    bonusPoints,
    totalPoints: basePoints + bonusPoints,
  };
}
