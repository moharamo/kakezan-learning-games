import test from 'node:test';
import assert from 'node:assert/strict';
import {
  answerRhythmQuestion,
  createRhythmSession,
  getRhythmProgress,
} from '../../src/games/rhythm-session.js';

function answer(state, value) {
  return answerRhythmQuestion(state, value).state;
}

test('選択した段を1倍から9倍まで順に出題する', () => {
  let state = createRhythmSession(3);
  const multipliers = [];
  while (!state.completed) {
    multipliers.push(state.currentQuestion.multiplier);
    state = answer(state, state.currentQuestion.answer);
  }
  assert.deepEqual(multipliers, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(getRhythmProgress(state), {
    introduced: 9,
    total: 9,
    percent: 100,
    attempts: 9,
    correctAttempts: 9,
    completed: true,
  });
});

test('誤答は正答を返すが再出題せず次の倍率へ進む', () => {
  let state = createRhythmSession(4);
  const result = answerRhythmQuestion(state, 99);
  state = result.state;
  assert.deepEqual(result.feedback, {
    correct: false,
    correctAnswer: 4,
    shouldShowCorrectAnswer: true,
  });

  assert.equal(state.currentQuestion.multiplier, 2);
  assert.equal(state.currentQuestion.kind, 'first');
});

test('正誤にかかわらず9問を一度ずつ回答すると完了する', () => {
  let state = createRhythmSession(2);
  const multipliers = [];
  while (!state.completed) {
    multipliers.push(state.currentQuestion.multiplier);
    state = answer(state, 0);
  }
  assert.deepEqual(multipliers, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(getRhythmProgress(state).introduced, 9);
  assert.equal(getRhythmProgress(state).attempts, 9);
  assert.equal(getRhythmProgress(state).correctAttempts, 0);
  assert.equal(state.completed, true);
});

test('不正な段と完了後の回答を拒否する', () => {
  assert.throws(() => createRhythmSession(0), RangeError);
  let state = createRhythmSession(1);
  while (!state.completed) state = answer(state, state.currentQuestion.answer);
  assert.throws(() => answerRhythmQuestion(state, 1), /complete/);
});
