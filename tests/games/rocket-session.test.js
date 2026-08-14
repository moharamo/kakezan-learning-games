import test from 'node:test';
import assert from 'node:assert/strict';
import {
  answerRocketQuestion,
  buildRocketChoices,
  buildRocketFormulaChoices,
  createRocketSession,
  getRocketProgress,
} from '../../src/games/rocket-session.js';

test('惑星は正答を含む重複なしの3つ', () => {
  const choices = buildRocketChoices({ multiplicand: 3, multiplier: 4, answer: 12 }, () => 0.5);
  assert.equal(choices.length, 3);
  assert.equal(new Set(choices).size, 3);
  assert.ok(choices.includes(12));
});

test('逆向き惑星は正しい式を含む重複なしの3つ', () => {
  const choices = buildRocketFormulaChoices({ multiplicand: 7, multiplier: 6, answer: 42 }, () => 0.5);
  assert.equal(choices.length, 3);
  assert.equal(new Set(choices).size, 3);
  assert.ok(choices.includes(6));
});

const now = Date.UTC(2026, 7, 14);
const fixedRandom = () => 0.25;

test('全レベルが選択段の9問をランダム順で重複なく出す', () => {
  for (const level of ['egg', 'chick', 'hen', 'star']) {
    const state = createRocketSession(7, level, { random: fixedRandom, now });
    assert.equal(state.questions.length, 9);
    assert.equal(new Set(state.questions.map(({ id }) => id)).size, 9);
    assert.ok(state.questions.every(({ chapter }) => chapter === 7));
    assert.notDeepEqual(state.questions.map(({ multiplier }) => multiplier), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  }
});

test('回答の正誤・応答時間を記録し9問で完了する', () => {
  let state = createRocketSession(3, 'egg', { random: fixedRandom, now });
  for (let index = 0; index < 9; index += 1) {
    const answer = index === 0 ? -1 : state.currentQuestion.answer;
    state = answerRocketQuestion(state, answer, 1_000 + index * 100, {
      answeredAt: now + index * 1_000,
    }).state;
  }
  const progress = getRocketProgress(state);
  assert.equal(progress.answered, 9);
  assert.equal(progress.correct, 8);
  assert.equal(progress.completed, true);
  assert.ok(progress.averageResponseTimeMs > 1_000);
  assert.equal(state.attempts[0].correct, false);
  assert.equal(state.attempts[0].responseTimeMs, 1_000);
  assert.equal(state.currentQuestion, null);
});

test('設定と応答時間を検証する', () => {
  assert.throws(() => createRocketSession(0, 'egg'), RangeError);
  assert.throws(() => createRocketSession(2, 'unknown'), RangeError);
  const state = createRocketSession(2, 'egg', { random: fixedRandom, now });
  assert.throws(() => answerRocketQuestion(state, 4, -1), RangeError);
});
