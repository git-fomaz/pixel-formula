export interface Driver {
  id: number;
  name: string;
  team: string;
  number: number;
  color: string;
}

export interface Race {
  id: number;
  name: string;
  circuit: string;
  date: string;
  country: string;
}

export const DRIVERS: Driver[] = [
  { id: 1, name: 'Max Verstappen', team: 'Red Bull', number: 1, color: '#3671C6' },
  { id: 2, name: 'Sergio Pérez', team: 'Red Bull', number: 11, color: '#3671C6' },
  { id: 3, name: 'Charles Leclerc', team: 'Ferrari', number: 16, color: '#E8002D' },
  { id: 4, name: 'Carlos Sainz', team: 'Ferrari', number: 55, color: '#E8002D' },
  { id: 5, name: 'Lando Norris', team: 'McLaren', number: 4, color: '#FF8000' },
  { id: 6, name: 'Oscar Piastri', team: 'McLaren', number: 81, color: '#FF8000' },
  { id: 7, name: 'Lewis Hamilton', team: 'Mercedes', number: 44, color: '#27F4D2' },
  { id: 8, name: 'George Russell', team: 'Mercedes', number: 63, color: '#27F4D2' },
  { id: 9, name: 'Fernando Alonso', team: 'Aston Martin', number: 14, color: '#229971' },
  { id: 10, name: 'Lance Stroll', team: 'Aston Martin', number: 18, color: '#229971' },
  { id: 11, name: 'Pierre Gasly', team: 'Alpine', number: 10, color: '#FF87BC' },
  { id: 12, name: 'Esteban Ocon', team: 'Alpine', number: 31, color: '#FF87BC' },
  { id: 13, name: 'Yuki Tsunoda', team: 'RB', number: 22, color: '#6692FF' },
  { id: 14, name: 'Daniel Ricciardo', team: 'RB', number: 3, color: '#6692FF' },
  { id: 15, name: 'Alexander Albon', team: 'Williams', number: 23, color: '#64C4FF' },
  { id: 16, name: 'Logan Sargeant', team: 'Williams', number: 2, color: '#64C4FF' },
  { id: 17, name: 'Valtteri Bottas', team: 'Kick Sauber', number: 77, color: '#52E252' },
  { id: 18, name: 'Zhou Guanyu', team: 'Kick Sauber', number: 24, color: '#52E252' },
  { id: 19, name: 'Kevin Magnussen', team: 'Haas', number: 20, color: '#B6BABD' },
  { id: 20, name: 'Nico Hulkenberg', team: 'Haas', number: 27, color: '#B6BABD' },
];

export const RACES: Race[] = [
  { id: 1, name: 'Bahrain GP', circuit: 'Bahrain International', date: '2026-03-02', country: 'Bahrain' },
  { id: 2, name: 'Saudi Arabian GP', circuit: 'Jeddah Corniche', date: '2026-03-09', country: 'Saudi Arabia' },
  { id: 3, name: 'Australian GP', circuit: 'Albert Park', date: '2026-03-23', country: 'Australia' },
  { id: 4, name: 'Japanese GP', circuit: 'Suzuka', date: '2026-04-06', country: 'Japan' },
  { id: 5, name: 'Chinese GP', circuit: 'Shanghai', date: '2026-04-20', country: 'China' },
  { id: 6, name: 'Miami GP', circuit: 'Miami International', date: '2026-05-04', country: 'USA' },
  { id: 7, name: 'Emilia-Romagna GP', circuit: 'Imola', date: '2026-05-18', country: 'Italy' },
  { id: 8, name: 'Monaco GP', circuit: 'Monaco', date: '2026-05-25', country: 'Monaco' },
  { id: 9, name: 'Canadian GP', circuit: 'Gilles Villeneuve', date: '2026-06-08', country: 'Canada' },
  { id: 10, name: 'Spanish GP', circuit: 'Barcelona-Catalunya', date: '2026-06-15', country: 'Spain' },
  { id: 11, name: 'Austrian GP', circuit: 'Red Bull Ring', date: '2026-06-29', country: 'Austria' },
  { id: 12, name: 'British GP', circuit: 'Silverstone', date: '2026-07-06', country: 'UK' },
  { id: 13, name: 'Hungarian GP', circuit: 'Hungaroring', date: '2026-07-20', country: 'Hungary' },
  { id: 14, name: 'Belgian GP', circuit: 'Spa-Francorchamps', date: '2026-07-27', country: 'Belgium' },
  { id: 15, name: 'Dutch GP', circuit: 'Zandvoort', date: '2026-08-24', country: 'Netherlands' },
  { id: 16, name: 'Italian GP', circuit: 'Monza', date: '2026-09-07', country: 'Italy' },
  { id: 17, name: 'Azerbaijan GP', circuit: 'Baku City', date: '2026-09-21', country: 'Azerbaijan' },
  { id: 18, name: 'Singapore GP', circuit: 'Marina Bay', date: '2026-10-05', country: 'Singapore' },
  { id: 19, name: 'United States GP', circuit: 'COTA', date: '2026-10-19', country: 'USA' },
  { id: 20, name: 'Mexico City GP', circuit: 'Hermanos Rodríguez', date: '2026-10-26', country: 'Mexico' },
  { id: 21, name: 'São Paulo GP', circuit: 'Interlagos', date: '2026-11-09', country: 'Brazil' },
  { id: 22, name: 'Las Vegas GP', circuit: 'Las Vegas Strip', date: '2026-11-22', country: 'USA' },
  { id: 23, name: 'Qatar GP', circuit: 'Lusail', date: '2026-11-30', country: 'Qatar' },
  { id: 24, name: 'Abu Dhabi GP', circuit: 'Yas Marina', date: '2026-12-07', country: 'UAE' },
];

export const POINTS_TABLE: Record<number, number> = {
  1: 25,
  2: 18,
  3: 15,
  4: 12,
  5: 10,
  6: 8,
  7: 6,
  8: 4,
  9: 2,
  10: 1,
};

export interface RaceResult {
  raceId: number;
  positions: number[];
}

export const MOCK_LAST_RESULTS: RaceResult = {
  raceId: 24,
  positions: [1, 5, 3, 6, 7, 8, 4, 9, 11, 15, 2, 12, 13, 10, 14, 16, 17, 18, 19, 20],
};

export function getPointsForPosition(position: number): number {
  return POINTS_TABLE[position] ?? 0;
}

export function calculateTeamPoints(selectedDriverIds: number[], results: RaceResult = MOCK_LAST_RESULTS): number {
  let total = 0;
  selectedDriverIds.forEach((driverId) => {
    const pos = results.positions.indexOf(driverId) + 1;
    if (pos > 0) {
      total += getPointsForPosition(pos);
    }
  });
  return total;
}

export function getDriverPosition(driverId: number, results: RaceResult = MOCK_LAST_RESULTS): number | null {
  const idx = results.positions.indexOf(driverId);
  return idx >= 0 ? idx + 1 : null;
}

export const getNextRace = (): Race => {
  const now = new Date();
  return RACES.find(r => new Date(r.date) > now) || RACES[RACES.length - 1];
};
