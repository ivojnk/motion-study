import test from 'node:test';
import assert from 'node:assert/strict';
import { nearbyChoices } from '../src/muscle-choice.js';

const sample = (id, distance, anatomyName = id) => ({
  distance, hit: { object: { userData: { courseMuscleId: id, anatomyName } }, point: {} }
});

test('nearby picking groups both sides of a muscle and retains the nearest surface', () => {
  const nearest = sample('biceps', 2, 'right biceps');
  const choices = nearbyChoices([sample('biceps', 14, 'left biceps'), sample('triceps', 7), nearest]);
  assert.deepEqual(choices.map(choice => choice.key), ['biceps', 'triceps']);
  assert.equal(choices[0].hit, nearest.hit);
});

test('misses and unnamed objects never create choices, and closest four take priority', () => {
  const choices = nearbyChoices([{ distance: 0 }, sample(null, 0, null), ...[5, 1, 3, 2, 4].map(n => sample('muscle-' + n, n))]);
  assert.deepEqual(choices.map(choice => choice.key), ['muscle-1', 'muscle-2', 'muscle-3', 'muscle-4']);
});

test('unmapped anatomical structures remain distinct choices', () => {
  const choices = nearbyChoices([sample(null, 2, 'Structure A'), sample(null, 1, 'Structure B'), sample(null, 3, 'Structure A')]);
  assert.deepEqual(choices.map(choice => choice.key), ['Structure B', 'Structure A']);
});
