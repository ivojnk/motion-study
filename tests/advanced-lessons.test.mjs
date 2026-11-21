import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { advancedLessonQuestions } from '../src/data/advanced-lessons.js';
import { levelPath, levelQuestions, topics } from '../src/learning.js';

const curriculum = JSON.parse(readFileSync(new URL('../src/data/curriculum.json', import.meta.url)));
const advancedTopics = ['voeding', 'kracht', 'coaching'];
const expectedLessonCounts = { voeding: 6, kracht: 7, coaching: 7 };
const generated = curriculum.questions.filter(question => advancedTopics.includes(question.region));

test('lessons 7–9 are source-linked, complete chapters with stable lesson queues', () => {
  assert.deepEqual(generated, advancedLessonQuestions);
  assert.deepEqual(topics.filter(topic => advancedTopics.includes(topic.id)).map(topic => topic.title), [
    'Voeding & leefstijl', 'Kracht maximaliseren', 'Holistische benadering'
  ]);

  for (const topic of advancedTopics) {
    const questions = generated.filter(question => question.region === topic);
    assert.ok(questions.length >= 42, topic + ' needs a comparable amount of source material');
    assert.ok(questions.every(question => question.source.kind === 'course-detail'));
    assert.ok(questions.every(question => question.source.title.startsWith('Les ')));

    const levels = levelPath({ completed: [] }).filter(level => level.topic.id === topic);
    assert.equal(levels.length, expectedLessonCounts[topic], topic + ' lesson count');
    for (const level of levels) {
      const queue = levelQuestions(curriculum.questions, topic, level.stage);
      assert.equal(queue.length, 7);
      assert.ok(queue.every(question => question.region === topic));
      assert.ok(queue.every(question => question.source.title.startsWith('Les ')));
    }
  }
});

test('existing lesson ids and queues stay intact when lessons 7–9 are added', () => {
  const previousQuestions = curriculum.questions.filter(question => !advancedTopics.includes(question.region));
  const previousPath = levelPath({ completed: [] }, previousQuestions);
  const currentPath = levelPath({ completed: [] });
  for (const oldLevel of previousPath) {
    const current = currentPath.find(level => level.id === oldLevel.id);
    assert.ok(current, oldLevel.id + ' is retained');
    assert.deepEqual(
      levelQuestions(curriculum.questions, oldLevel.topic.id, oldLevel.stage),
      levelQuestions(previousQuestions, oldLevel.topic.id, oldLevel.stage),
      oldLevel.id
    );
  }
});
