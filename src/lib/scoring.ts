export interface ScoreResult {
  rulesVersion: string;
  positions: Array<{
    position: number;
    driver: string;
    actual: string;
    matched: boolean;
    misplaced: boolean;
    points: number;
  }>;
  exactHits: number;
  misplacedHits: number;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
}

const POINTS = [15, 12, 10, 8, 8];
const TOP_FIVE_POINTS = 4;
const BONUS = [0, 0, 2, 5, 10, 20];

export function calculateScore(picks: string[], actual: string[], multiplier = 1): ScoreResult {
  for (const arr of [picks, actual]) {
    if (!Array.isArray(arr) || arr.length !== 5 || new Set(arr).size !== 5 || arr.some(v => typeof v !== 'string' || !v.trim())) {
      throw new Error('Нужны пять разных пилотов');
    }
  }

  const topFive = new Set(actual.slice(0, 5));
  const positions = picks.map((driver, i) => {
    const matched = driver === actual[i];
    const misplaced = !matched && topFive.has(driver);

    return {
      position: i + 1,
      driver,
      actual: actual[i],
      matched,
      misplaced,
      points: (matched ? POINTS[i] : misplaced ? TOP_FIVE_POINTS : 0) * multiplier,
    };
  });

  const exactHits = positions.filter(x => x.matched).length;
  const misplacedHits = positions.filter(x => x.misplaced).length;
  const basePoints = positions.reduce((s, x) => s + x.points, 0);
  const bonusPoints = BONUS[exactHits] * multiplier;

  return {
    rulesVersion: multiplier === 1 ? 'top5-v2' : 'top5-q-v2',
    positions,
    exactHits,
    misplacedHits,
    basePoints,
    bonusPoints,
    totalPoints: basePoints + bonusPoints,
  };
}
