export interface Card {
  id: string;
  name: string;
  rarity: 'Basic' | 'Rare' | 'Unique' | 'Masterpiece';
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
];
