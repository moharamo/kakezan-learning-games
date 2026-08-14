import { QUESTION_BANK } from '../learning/question-bank.js';
import { createMasteryRecord, recordAttempt } from '../learning/mastery.js';

export const NINJA_LEVELS = Object.freeze({
  egg: Object.freeze({ questions: 5, timeLimitMs: 12_000 }),
  chick: Object.freeze({ questions: 7, timeLimitMs: 9_000 }),
  hen: Object.freeze({ questions: 10, timeLimitMs: 7_000 }),
  star: Object.freeze({ questions: 15, timeLimitMs: 5_000 }),
});

function shuffle(values, random) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.min(index, Math.floor(random() * (index + 1)));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export function createNinjaSession(level, {
  masteryById = {}, random = Math.random, now = Date.now(),
} = {}) {
  const settings = NINJA_LEVELS[level];
  if (!settings) throw new RangeError('unknown ninja level');
  const questions = shuffle(QUESTION_BANK, random).slice(0, settings.questions);
  return {
    level, settings, questions: Object.freeze(questions), currentIndex: 0,
    currentQuestion: questions[0], attempts: [], masteryById: { ...masteryById },
    now, completed: false,
  };
}

export function answerNinjaQuestion(state, submittedAnswer, responseTimeMs, {
  answeredAt = Date.now(), timedOut = false,
} = {}) {
  if (state.completed) throw new Error('ninja session is already complete');
  if (!Number.isFinite(responseTimeMs) || responseTimeMs < 0) throw new RangeError('invalid response time');
  const numeric = timedOut ? null : (typeof submittedAnswer === 'string' ? Number(submittedAnswer.trim()) : submittedAnswer);
  const correct = !timedOut && Number.isFinite(numeric) && numeric === state.currentQuestion.answer;
  const attempt = { questionId: state.currentQuestion.id, submittedAnswer, correct, timedOut, responseTimeMs, answeredAt };
  const oldRecord = state.masteryById[state.currentQuestion.id] ?? createMasteryRecord(state.currentQuestion.id);
  const masteryById = { ...state.masteryById, [state.currentQuestion.id]: recordAttempt(oldRecord, { correct, responseTimeMs, answeredAt }) };
  const currentIndex = state.currentIndex + 1;
  const completed = currentIndex === state.questions.length;
  return {
    state: { ...state, currentIndex, currentQuestion: completed ? null : state.questions[currentIndex], attempts: [...state.attempts, attempt], masteryById, completed },
    feedback: { correct, timedOut, correctAnswer: state.currentQuestion.answer },
  };
}

export function getNinjaProgress(state) {
  const answered = state.attempts.length;
  const correct = state.attempts.filter((attempt) => attempt.correct).length;
  return { answered, total: state.questions.length, correct, percent: Math.round(answered / state.questions.length * 100), completed: state.completed };
}
