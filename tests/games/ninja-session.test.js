import test from 'node:test';
import assert from 'node:assert/strict';
import { answerNinjaQuestion, createNinjaSession, getNinjaProgress, NINJA_LEVELS } from '../../src/games/ninja-session.js';

test('レベルごとの問題数と制限時間を設定する', () => {
  assert.deepEqual(Object.values(NINJA_LEVELS).map((level) => [level.questions, level.timeLimitMs]), [[5,12000],[7,9000],[10,7000],[15,5000]]);
});

test('全81問から重複なしでランダム出題する', () => {
  for (const level of Object.keys(NINJA_LEVELS)) {
    const session = createNinjaSession(level, { random: () => 0.4 });
    assert.equal(session.questions.length, NINJA_LEVELS[level].questions);
    assert.equal(new Set(session.questions.map((q) => q.id)).size, session.questions.length);
  }
});

test('時間切れを誤答として記録して最後まで進む', () => {
  let session = createNinjaSession('egg', { random: () => 0 });
  session = answerNinjaQuestion(session, null, 12000, { timedOut: true }).state;
  while (!session.completed) session = answerNinjaQuestion(session, session.currentQuestion.answer, 1000).state;
  const progress = getNinjaProgress(session);
  assert.equal(progress.correct, 4);
  assert.equal(progress.completed, true);
  assert.equal(session.attempts[0].timedOut, true);
});
