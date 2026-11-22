export type PredictionMode = 'race' | 'qualifying';

export interface PredictionRace {
  id: string;
  name: string;
  circuit: string;
  weekend: string;
  round: number;
  unlockAfterRound: number;
  qualifyingDeadline: string;
  raceDeadline: string;
  banner: string | null;
}

// Official 2026 session start times in UTC. Entries unlock only when the
// previous round's race results have been published on our server.
export const PREDICTION_RACES: PredictionRace[] = [
  {
    id: 'qatar-2026',
    name: 'Гран-при Катара',
    circuit: 'Lusail International Circuit',
    weekend: '27–29 ноября 2026',
    round: 22,
    unlockAfterRound: 21,
    qualifyingDeadline: '2026-11-28T18:00:00Z',
    raceDeadline: '2026-11-29T16:00:00Z',
    banner: '/qatar-banner.webp',
  },
  {
    id: 'abu-dhabi-2026',
    name: 'Гран-при Абу-Даби',
    circuit: 'Yas Marina Circuit',
    weekend: '4–6 декабря 2026',
    round: 23,
    unlockAfterRound: 22,
    qualifyingDeadline: '2026-12-05T14:00:00Z',
    raceDeadline: '2026-12-06T13:00:00Z',
    banner: null,
  },
];

export const PREDICTION_DRIVERS = [
  'Lando Norris', 'Oscar Piastri', 'George Russell', 'Kimi Antonelli',
  'Max Verstappen', 'Isack Hadjar', 'Charles Leclerc', 'Lewis Hamilton',
  'Alex Albon', 'Carlos Sainz', 'Liam Lawson', 'Arvid Lindblad',
  'Fernando Alonso', 'Lance Stroll', 'Pierre Gasly', 'Franco Colapinto',
  'Rafael Camara', 'Oliver Bearman', 'Nico Hulkenberg', 'Gabriel Bortoleto',
  'Valtteri Bottas', 'Sergio Perez',
] as const;

export function getAvailablePredictionRace(publishedRound: number | null): PredictionRace | null {
  if (publishedRound === null || !Number.isInteger(publishedRound)) return null;
  return PREDICTION_RACES.find((race) => race.unlockAfterRound === publishedRound) ?? null;
}

export function predictionRaceId(race: PredictionRace, mode: PredictionMode): string {
  return mode === 'qualifying' ? `${race.id}-q` : race.id;
}

export function predictionDeadline(race: PredictionRace, mode: PredictionMode): string {
  return mode === 'qualifying' ? race.qualifyingDeadline : race.raceDeadline;
}

export function isPredictionOpen(race: PredictionRace, mode: PredictionMode, now: number): boolean {
  return now < Date.parse(predictionDeadline(race, mode));
}
