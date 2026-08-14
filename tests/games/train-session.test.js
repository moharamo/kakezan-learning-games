import test from 'node:test';
import assert from 'node:assert/strict';
import { answerTrainQuestion, buildTrainChoices, createTrainSession, getTrainProgress } from '../../src/games/train-session.js';

test('分岐の選択肢は正答を含む重複なしの3つ', () => {
  const choices = buildTrainChoices({ multiplicand: 3, multiplier: 4, answer: 12 }, () => 0.5);
  assert.equal(choices.length, 3);
  assert.equal(new Set(choices).size, 3);
  assert.ok(choices.includes(12));
  assert.ok(choices.includes(9));
  assert.ok(choices.includes(15));
});

test('たまごは選んだ2段から6問を均等に混ぜる', () => {
  const session = createTrainSession([2, 5], 'egg', { random: () => 0 });
  assert.equal(session.questions.length, 6);
  assert.deepEqual([...new Set(session.questions.map((q) => q.chapter))].sort(), [2, 5]);
  assert.equal(session.questions.filter((q) => q.chapter === 2).length, 3);
  assert.equal(session.questions.filter((q) => q.chapter === 5).length, 3);
});

test('各レベルは必要な段数と問題数を使う', () => {
  assert.equal(createTrainSession([1, 2, 3], 'chick').questions.length, 9);
  assert.equal(createTrainSession([1, 2, 3, 4, 5], 'hen').questions.length, 10);
  assert.equal(createTrainSession([1, 2, 3, 4, 5, 6, 7, 8, 9], 'star').questions.length, 12);
  assert.throws(() => createTrainSession([1], 'egg'), RangeError);
});

test('回答を記録して最後の駅で完了する', () => {
  let session = createTrainSession([2, 3], 'egg', { random: () => 0 });
  for (let index = 0; index < 6; index += 1) {
    session = answerTrainQuestion(session, session.currentQuestion.answer, 1200).state;
  }
  assert.equal(session.completed, true);
  assert.deepEqual(getTrainProgress(session), { answered: 6, total: 6, percent: 100, correct: 6, completed: true });
});
