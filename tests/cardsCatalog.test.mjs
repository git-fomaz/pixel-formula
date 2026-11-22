import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { PF_CARDS, LAS_VEGAS_2026_CARDS } from '../src/data/cards.ts';

const LAS_VEGAS_CARDS = [
  ['26_Max_Verstappen_Unique_Las_Vegas_Winner', 'Unique'],
  ['27_Lando_Norris_Rare_USA', 'Rare'],
  ['28_Oscar_Piastri_Rare_USA', 'Rare'],
  ['29_Kimi_Antonelli_Rare_USA', 'Rare'],
  ['30_Pierre_Gasly_Rare_USA', 'Rare'],
];

test('Every card ID is unique and every artwork file exists', () => {
  assert.equal(new Set(PF_CARDS.map((card) => card.id)).size, PF_CARDS.length);
  for (const card of PF_CARDS) {
    const path = fileURLToPath(new URL(`../public${card.image}`, import.meta.url));
    assert.ok(existsSync(path), `Missing artwork for ${card.id}`);
  }
});

test('All five Vegas edition cards are included in their rarity pools', () => {
  assert.equal(LAS_VEGAS_2026_CARDS.length, 5);
  for (const [id, rarity] of LAS_VEGAS_CARDS) {
    assert.equal(PF_CARDS.find((card) => card.id === id)?.rarity, rarity);
  }
  assert.equal(LAS_VEGAS_2026_CARDS.filter((card) => card.rarity === 'Rare').length, 4);
  assert.equal(LAS_VEGAS_2026_CARDS.filter((card) => card.rarity === 'Unique').length, 1);
  assert.match(PF_CARDS.find((card) => card.id === LAS_VEGAS_CARDS[0][0]).name, /Las Vegas Winner/);
});
