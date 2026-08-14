import test from 'node:test';
import assert from 'node:assert/strict';
import { createMasteryRecord } from '../../src/learning/mastery.js';
import { calculatePriority, selectNextQuestion } from '../../src/learning/scheduler.js';

const now = Date.UTC(2026, 7, 14);
const question = (id) => ({ id });

function record(id, overrides) {
  return { ...createMasteryRecord(id), attempts: 1, ...overrides };
}

test('誤答、期限超過、遅い回答を優先する', () => {
  const normal = record('2x2', { lastCorrect: true, lastResponseTimeMs: 2_000, nextReviewAt: now + 60_000 });
  const slow = record('3x3', { lastCorrect: true, lastResponseTimeMs: 8_000, nextReviewAt: now + 60_000 });
  const due = record('4x4', { lastCorrect: true, lastResponseTimeMs: 2_000, nextReviewAt: now - 60_000 });
  const wrong = record('5x5', { lastCorrect: false, lastResponseTimeMs: 2_000, nextReviewAt: now + 60_000 });
  assert.ok(calculatePriority(wrong, now) > calculatePriority(normal, now));
  assert.ok(calculatePriority(due, now) > calculatePriority(normal, now));
  assert.ok(calculatePriority(slow, now) > calculatePriority(normal, now));
});

test('最優先の問題を選び、直前問題を除外できる', () => {
  const questions = [question('2x2'), question('3x3'), question('4x4')];
  const mastery = {
    '2x2': record('2x2', { lastCorrect: true, lastResponseTimeMs: 2_000, nextReviewAt: now + 60_000 }),
    '3x3': record('3x3', { lastCorrect: false, lastResponseTimeMs: 2_000, nextReviewAt: now + 60_000 }),
  };
  assert.equal(selectNextQuestion(questions, mastery, { now, random: () => 0 }).id, '3x3');
  assert.equal(selectNextQuestion(questions, mastery, { now, random: () => 0, excludeIds: ['3x3'] }).id, '4x4');
});

