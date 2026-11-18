export interface Card {
  id: string;
  name: string;
  rarity: 'Basic' | 'Rare' | 'Unique' | 'Masterpiece' | 'Legendary';
  image: string;
}

export const PF_CARDS: Card[] = [
  { id: '01_Charles_Leclerc_Rare', name: 'Charles Leclerc', rarity: 'Rare', image: '/cards/01_Charles_Leclerc_Rare.jpg' },
  { id: '02_Charles_Leclerc_Basic', name: 'Charles Leclerc', rarity: 'Basic', image: '/cards/02_Charles_Leclerc_Basic.jpg' },
  { id: '03_Charles_Leclerc_Masterpiece_Monza', name: 'Charles Leclerc', rarity: 'Masterpiece', image: '/cards/03_Charles_Leclerc_Masterpiece_Monza.jpg' },
  { id: '04_Liam_Lawson_Rare', name: 'Liam Lawson', rarity: 'Rare', image: '/cards/04_Liam_Lawson_Rare.jpg' },
  { id: '05_Lando_Norris_Basic', name: 'Lando Norris', rarity: 'Basic', image: '/cards/05_Lando_Norris_Basic.jpg' },
  { id: '06_Isack_Hadjar_Basic', name: 'Isack Hadjar', rarity: 'Basic', image: '/cards/06_Isack_Hadjar_Basic.jpg' },
  { id: '07_Max_Verstappen_Basic', name: 'Max Verstappen', rarity: 'Basic', image: '/cards/07_Max_Verstappen_Basic.jpg' },
  { id: '08_Max_Verstappen_Unique_GT3_Nurburgring', name: 'Max Verstappen', rarity: 'Unique', image: '/cards/08_Max_Verstappen_Unique_GT3_Nurburgring.jpg' },
  { id: '09_Alex_Albon_Basic', name: 'Alex Albon', rarity: 'Basic', image: '/cards/09_Alex_Albon_Basic.jpg' },
  { id: '10_Fernando_Alonso_Basic', name: 'Fernando Alonso', rarity: 'Basic', image: '/cards/10_Fernando_Alonso_Basic.jpg' },
  { id: '11_Oliver_Bearman_Basic', name: 'Oliver Bearman', rarity: 'Basic', image: '/cards/11_Oliver_Bearman_Basic.jpg' },
  { id: '12_Valtteri_Bottas_Basic', name: 'Valtteri Bottas', rarity: 'Basic', image: '/cards/12_Valtteri_Bottas_Basic.jpg' },
  { id: '13_Rafael_Camara_Basic', name: 'Rafael Camara', rarity: 'Basic', image: '/cards/13_Rafael_Camara_Basic.jpg' },
  { id: '14_Franco_Colapinto_Basic', name: 'Franco Colapinto', rarity: 'Basic', image: '/cards/14_Franco_Colapinto_Basic.jpg' },
  { id: '15_Gabriel_Bortoleto_Basic', name: 'Gabriel Bortoleto', rarity: 'Basic', image: '/cards/15_Gabriel_Bortoleto_Basic.jpg' },
  { id: '16_Pierre_Gasly_Basic', name: 'Pierre Gasly', rarity: 'Basic', image: '/cards/16_Pierre_Gasly_Basic.jpg' },
  { id: '17_Kimi_Antonelli_Basic', name: 'Kimi Antonelli', rarity: 'Basic', image: '/cards/17_Kimi_Antonelli_Basic.jpg' },
  { id: '18_Lewis_Hamilton_Basic', name: 'Lewis Hamilton', rarity: 'Basic', image: '/cards/18_Lewis_Hamilton_Basic.jpg' },
  { id: '19_Sergio_Perez_Basic', name: 'Sergio Perez', rarity: 'Basic', image: '/cards/19_Sergio_Perez_Basic.jpg' },
  { id: '20_Oscar_Piastri_Basic', name: 'Oscar Piastri', rarity: 'Basic', image: '/cards/20_Oscar_Piastri_Basic.jpg' },
  { id: '21_George_Russell_Basic', name: 'George Russell', rarity: 'Basic', image: '/cards/21_George_Russell_Basic.jpg' },
  { id: '22_Carlos_Sainz_Basic', name: 'Carlos Sainz', rarity: 'Basic', image: '/cards/22_Carlos_Sainz_Basic.jpg' },
  { id: '23_Lance_Stroll_Basic', name: 'Lance Stroll', rarity: 'Basic', image: '/cards/23_Lance_Stroll_Basic.jpg' },
  { id: '24_Nico_Hulkenberg_Basic', name: 'Nico Hulkenberg', rarity: 'Basic', image: '/cards/24_Nico_Hulkenberg_Basic.jpg' },
  { id: '25_YOU_Legendary_Beta', name: 'YOU', rarity: 'Legendary', image: '/cards/25_YOU_Legendary_Beta.jpg' },
];
