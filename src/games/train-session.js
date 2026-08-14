import { QUESTION_BANK } from '../learning/question-bank.js';
import { createMasteryRecord, recordAttempt } from '../learning/mastery.js';

export const TRAIN_LEVELS = Object.freeze({
  egg: Object.freeze({ tables: 2, questions: 6 }),
  chick: Object.freeze({ tables: 3, questions: 9 }),
  hen: Object.freeze({ tables: 5, questions: 10 }),
  star: Object.freeze({ tables: 9, questions: 12 }),
});

function shuffle(values, random) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.min(index, Math.floor(random() * (index + 1)));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

/** 正答と、九九としてありそうな近い誤答2つをランダム順で返す。 */
export function buildTrainChoices(question, random = Math.random) {
  const candidates = [
    question.answer,
    question.multiplicand * Math.max(1, question.multiplier - 1),
    question.multiplicand * Math.min(9, question.multiplier + 1),
    Math.max(1, question.answer - question.multiplier),
    Math.min(81, question.answer + question.multiplier),
    Math.max(1, question.answer - 1),
    Math.min(81, question.answer + 1),
  ];
  const unique = [...new Set([
    ...candidates,
    ...Array.from({ length: 81 }, (_, index) => index + 1)
      .sort((a, b) => Math.abs(a - question.answer) - Math.abs(b - question.answer)),
  ])].filter((value) => value !== question.answer);
  return Object.freeze(shuffle([question.answer, ...unique.slice(0, 2)], random));
}

export function createTrainSession(tables, level, {
  masteryById = {}, random = Math.random, now = Date.now(),
} = {}) {
  const settings = TRAIN_LEVELS[level];
  if (!settings) throw new RangeError('unknown train level');
  const uniqueTables = [...new Set(tables)].sort((a, b) => a - b);
  if (uniqueTables.length !== settings.tables
    || uniqueTables.some((table) => !Number.isInteger(table) || table < 1 || table > 9)) {
    throw new RangeError(`train level ${level} needs ${settings.tables} unique tables`);
  }

  const byTable = new Map(uniqueTables.map((table) => [
    table,
    shuffle(QUESTION_BANK.filter((q) => q.chapter === table), random),
  ]));
  const questions = [];
  for (let index = 0; index < settings.questions; index += 1) {
    const table = uniqueTables[index % uniqueTables.length];
    questions.push(byTable.get(table).shift());
  }
  const mixed = shuffle(questions, random);

  return {
    level, tables: uniqueTables, questions: Object.freeze(mixed), currentIndex: 0,
    currentQuestion: mixed[0], attempts: [], masteryById: { ...masteryById }, now,
    completed: false,
  };
}

export function answerTrainQuestion(state, submittedAnswer, responseTimeMs, { answeredAt = Date.now() } = {}) {
  if (state.completed) throw new Error('train session is already complete');
  if (!Number.isFinite(responseTimeMs) || responseTimeMs < 0) throw new RangeError('invalid response time');
  const numeric = typeof submittedAnswer === 'string' ? Number(submittedAnswer.trim()) : submittedAnswer;
  const correct = Number.isFinite(numeric) && numeric === state.currentQuestion.answer;
  const attempt = { questionId: state.currentQuestion.id, submittedAnswer, correct, responseTimeMs, answeredAt };
  const oldRecord = state.masteryById[state.currentQuestion.id] ?? createMasteryRecord(state.currentQuestion.id);
  const masteryById = { ...state.masteryById, [state.currentQuestion.id]: recordAttempt(oldRecord, { correct, responseTimeMs, answeredAt }) };
  const currentIndex = state.currentIndex + 1;
  const completed = currentIndex === state.questions.length;
  return {
    state: { ...state, currentIndex, currentQuestion: completed ? null : state.questions[currentIndex], attempts: [...state.attempts, attempt], masteryById, completed },
    feedback: { correct, correctAnswer: state.currentQuestion.answer },
  };
}

export function getTrainProgress(state) {
  const answered = state.attempts.length;
  const correct = state.attempts.filter((attempt) => attempt.correct).length;
  return { answered, total: state.questions.length, percent: Math.round(answered / state.questions.length * 100), correct, completed: state.completed };
}
