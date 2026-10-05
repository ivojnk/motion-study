import test from 'node:test';
import assert from 'node:assert/strict';
import { lessonGroups } from '../src/lesson-groups.js';
import { levelPath, topics } from '../src/learning.js';

test('every chapter groups all existing lessons in order, with two to five lessons per node', () => {
  const path = levelPath({ completed: [] });
  for (const topic of topics) {
    const levels = path.filter(level => level.topic.id === topic.id);
    const groups = lessonGroups(levels);
    assert.deepEqual(groups.flatMap(group => group.lessons.map(level => level.id)), levels.map(level => level.id));
    assert.ok(groups.every(group => group.lessons.length >= 2 && group.lessons.length <= 5));
    assert.equal(groups[0].type, 'learn');
    assert.equal(groups.at(-1).type, 'finish');
  }
});

test('partial progress fills the same group and advances only to its next unfinished lesson', () => {
  const groupsFor = completed => lessonGroups(levelPath({ completed }).filter(level => level.topic.id === 'basis'));
  const fresh = groupsFor([]);
  assert.equal(fresh[0].next.id, 'basis:0');
  assert.equal(fresh[1].locked, true);
  const partial = groupsFor(['basis:0']);
  assert.equal(partial[0].completed, 1);
  assert.equal(partial[0].done, false);
  assert.equal(partial[0].next.id, 'basis:1');
  assert.equal(partial[1].locked, true);
  const finished = groupsFor(fresh[0].lessons.map(level => level.id));
  assert.equal(finished[0].done, true);
  assert.equal(finished[0].completed, finished[0].lessons.length);
  assert.equal(finished[0].next.id, 'basis:0');
  assert.equal(finished[1].locked, false);
  assert.equal(finished[1].next.id, fresh[1].lessons[0].id);
});

test('completed chapters remain replayable and each group type keeps its own icon', () => {
  const path = levelPath({ completed: [] });
  const completed = levelPath({ completed: path.map(level => level.id) });
  const groups = lessonGroups(completed.filter(level => level.topic.id === 'basis'));
  assert.ok(groups.every(group => group.done && !group.locked));
  assert.equal(groups[0].icon, 'star');
  assert.equal(groups[1].icon, 'barbell');
  assert.equal(groups.at(-1).icon, 'trophy');
  assert.deepEqual(lessonGroups([]), []);
});
