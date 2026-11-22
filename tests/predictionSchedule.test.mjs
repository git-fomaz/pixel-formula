import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAvailablePredictionRace,
  isPredictionOpen,
  predictionDeadline,
  predictionRaceId,
} from '../src/lib/predictionSchedule.ts';

test('Qatar opens only after Las Vegas results are published', () => {
  assert.equal(getAvailablePredictionRace(null), null);
  assert.equal(getAvailablePredictionRace(20), null);
  assert.equal(getAvailablePredictionRace(21)?.id, 'qatar-2026');
});

test('Abu Dhabi opens after Qatar results; season ends after Abu Dhabi', () => {
  assert.equal(getAvailablePredictionRace(22)?.id, 'abu-dhabi-2026');
  assert.equal(getAvailablePredictionRace(23), null);
});

test('Qualifying and race have separate IDs and correct UTC deadlines', () => {
  const qatar = getAvailablePredictionRace(21);
  assert.ok(qatar);
  assert.equal(predictionRaceId(qatar, 'qualifying'), 'qatar-2026-q');
  assert.equal(predictionRaceId(qatar, 'race'), 'qatar-2026');
  assert.equal(predictionDeadline(qatar, 'qualifying'), '2026-11-28T18:00:00Z');
  assert.equal(predictionDeadline(qatar, 'race'), '2026-11-29T16:00:00Z');
  const abuDhabi = getAvailablePredictionRace(22);
  assert.ok(abuDhabi);
  assert.equal(predictionDeadline(abuDhabi, 'qualifying'), '2026-12-05T14:00:00Z');
  assert.equal(predictionDeadline(abuDhabi, 'race'), '2026-12-06T13:00:00Z');
});

test('A prediction closes precisely at its own session start', () => {
  const qatar = getAvailablePredictionRace(21);
  assert.ok(qatar);
  const qualifyingStart = Date.parse(qatar.qualifyingDeadline);
  assert.equal(isPredictionOpen(qatar, 'qualifying', qualifyingStart - 1), true);
  assert.equal(isPredictionOpen(qatar, 'qualifying', qualifyingStart), false);
  assert.equal(isPredictionOpen(qatar, 'race', qualifyingStart), true);
  assert.equal(isPredictionOpen(qatar, 'race', Date.parse(qatar.raceDeadline)), false);
});
