import test from 'node:test';
import assert from 'node:assert/strict';
import { createMasteryRecord, getMasteryStatus, recordAttempt } from '../../src/learning/mastery.js';

test('速い正答は復習間隔を伸ばす', () => {
  const start = Date.UTC(2026, 7, 14);
  const first = recordAttempt(createMasteryRecord('7x8'), { correct: true, responseTimeMs: 2_000, answeredAt: start });
  const second = recordAttempt(first, { correct: true, responseTimeMs: 2_000, answeredAt: start + 86_400_000 });
  assert.ok(second.nextReviewAt - second.lastAnsweredAt > first.nextReviewAt - first.lastAnsweredAt);
  assert.equal(second.successfulDays.length, 2);
});

test('遅い正答と誤答は短期復習へ戻る', () => {
  const start = Date.UTC(2026, 7, 14);
  const fluent = recordAttempt(createMasteryRecord('6x7'), { correct: true, responseTimeMs: 1_000, answeredAt: start });
  const slow = recordAttempt(fluent, { correct: true, responseTimeMs: 7_000, answeredAt: start + 1_000 });
  const wrong = recordAttempt(fluent, { correct: false, responseTimeMs: 2_000, answeredAt: start + 1_000 });
  assert.equal(slow.intervalLevel, 0);
  assert.equal(wrong.intervalLevel, 0);
  assert.equal(wrong.lapseCount, 1);
});

test('同日の連続正解だけでは習熟にならない', () => {
  const start = Date.UTC(2026, 7, 14);
  let record = createMasteryRecord('8x8');
  for (let i = 0; i < 4; i += 1) {
    record = recordAttempt(record, { correct: true, responseTimeMs: 1_000, answeredAt: start + i * 1_000 });
  }
  assert.equal(record.successfulDays.length, 1);
  assert.notEqual(getMasteryStatus(record), 'mastered');
});

