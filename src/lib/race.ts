// Shared race & prediction helpers

export const CURRENT_RACE = {
  id: 'las-vegas-2026',
  name: 'Гран-при Лас-Вегаса',
  deadline: '2026-11-22T04:00:00Z',
  start: '2026-11-22T04:00:00Z',
  round: '21',
};

export const PREDICTION_KEY = `pf:prediction:${CURRENT_RACE.id}`;

export function getPrediction(): { picks: string[]; savedAt: string } | null {
  try {
    const raw = localStorage.getItem(PREDICTION_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (v?.picks?.length === 5) return v;
  } catch {}
  return null;
}

export function hasPrediction(): boolean {
  return !!getPrediction();
}

export interface RaceResult {
  position: number;
  name: string;
  code?: string | null;
  points: number;
  constructor?: string;
}

export interface LastRacePayload {
  round: string;
  raceName: string;
  date: string;
  results: RaceResult[];
}

const MOCK_LAST_RACE: LastRacePayload = {
  round: '20',
  raceName: 'Brazilian Grand Prix',
  date: '2026-11-08',
  results: [
    { position: 1, name: 'Lando Norris', code: 'NOR', points: 25, constructor: 'McLaren' },
    { position: 2, name: 'Max Verstappen', code: 'VER', points: 18, constructor: 'Red Bull' },
    { position: 3, name: 'Isack Hadjar', code: 'HAD', points: 15, constructor: 'Racing Bulls' },
    { position: 4, name: 'Charles Leclerc', code: 'LEC', points: 12, constructor: 'Ferrari' },
    { position: 5, name: 'George Russell', code: 'RUS', points: 10, constructor: 'Mercedes' },
  ],
};

export async function fetchResultsForRound(round: string): Promise<LastRacePayload | null> {
  try {
    const res = await fetch(`/api/results?round=${round}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.results?.length) {
        return {
          round: data.round,
          raceName: data.raceName,
          date: data.date,
          results: data.results.map((r: any) => ({
            position: r.position,
            name: r.name,
            code: r.code,
            points: r.points,
            constructor: r.constructor,
          })),
        };
      }
    }
  } catch {}
  return null;
}

export async function fetchLastResults(): Promise<LastRacePayload | null> {
  // 1. Try our API (Redis)
  try {
    const res = await fetch('/api/results');
    if (res.ok) {
      const data = await res.json();
      if (data?.results?.length) {
        return {
          round: data.round,
          raceName: data.raceName,
          date: data.date,
          results: data.results.slice(0, 10).map((r: any) => ({
            position: r.position,
            name: r.name,
            code: r.code,
            points: r.points,
            constructor: r.constructor,
          })),
        };
      }
    }
  } catch {}

  // 2. Try Jolpica directly
  try {
    const res = await fetch('https://api.jolpi.ca/ergast/f1/2026/last/results.json', {
      headers: { 'User-Agent': 'PixelFormula/1.0' },
    });
    if (res.ok) {
      const data = await res.json();
      const race = data?.MRData?.RaceTable?.Races?.[0];
      if (race?.Results?.length) {
        return {
          round: race.round,
          raceName: race.raceName,
          date: race.date,
          results: race.Results.slice(0, 10).map((r: any) => ({
            position: Number(r.position),
            name: `${r.Driver.givenName} ${r.Driver.familyName}`,
            code: r.Driver.code || null,
            points: Number(r.points),
            constructor: r.Constructor?.name,
          })),
        };
      }
    }
  } catch {}

  // 3. Fallback mock so the feature is visible on Home
  return MOCK_LAST_RACE;
}

export const DRIVER_AVATAR: Record<string, string> = {
  'Lando Norris': '/cards/05_Lando_Norris_Basic.jpg',
  'Max Verstappen': '/cards/07_Max_Verstappen_Basic.jpg',
  'Isack Hadjar': '/cards/06_Isack_Hadjar_Basic.jpg',
  'Charles Leclerc': '/cards/02_Charles_Leclerc_Basic.jpg',
  'Liam Lawson': '/cards/04_Liam_Lawson_Rare.jpg',
  'George Russell': '/cards/21_George_Russell_Basic.jpg',
  'Kimi Antonelli': '/cards/17_Kimi_Antonelli_Basic.jpg',
  'Andrea Kimi Antonelli': '/cards/17_Kimi_Antonelli_Basic.jpg',
  'Lewis Hamilton': '/cards/18_Lewis_Hamilton_Basic.jpg',
  'Oscar Piastri': '/cards/20_Oscar_Piastri_Basic.jpg',
  'Carlos Sainz': '/cards/22_Carlos_Sainz_Basic.jpg',
  'Alex Albon': '/cards/09_Alex_Albon_Basic.jpg',
  'Alexander Albon': '/cards/09_Alex_Albon_Basic.jpg',
  'Fernando Alonso': '/cards/10_Fernando_Alonso_Basic.jpg',
  'Oliver Bearman': '/cards/11_Oliver_Bearman_Basic.jpg',
  'Valtteri Bottas': '/cards/12_Valtteri_Bottas_Basic.jpg',
  'Franco Colapinto': '/cards/14_Franco_Colapinto_Basic.jpg',
  'Gabriel Bortoleto': '/cards/15_Gabriel_Bortoleto_Basic.jpg',
  'Pierre Gasly': '/cards/16_Pierre_Gasly_Basic.jpg',
  'Sergio Perez': '/cards/19_Sergio_Perez_Basic.jpg',
  'Sergio Pérez': '/cards/19_Sergio_Perez_Basic.jpg',
  'Lance Stroll': '/cards/23_Lance_Stroll_Basic.jpg',
  'Nico Hulkenberg': '/cards/24_Nico_Hulkenberg_Basic.jpg',
  'Nico Hülkenberg': '/cards/24_Nico_Hulkenberg_Basic.jpg',
};

export function driverInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const d = Math.floor(ms / 86400000);
  const h = String(Math.floor(ms / 3600000) % 24).padStart(2, '0');
  const m = String(Math.floor(ms / 60000) % 60).padStart(2, '0');
  const s = String(Math.floor(ms / 1000) % 60).padStart(2, '0');
  return d > 0 ? `${d}д ${h}:${m}:${s}` : `${h}:${m}:${s}`;
}
