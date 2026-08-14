import { QUESTION_BANK } from '../learning/question-bank.js';
import {
  createMasteryRecord,
  recordAttempt,
} from '../learning/mastery.js';

const LEVELS = Object.freeze(['egg', 'chick', 'hen', 'star']);
const SESSION_LENGTH = 9;

function assertSettings(dan, level, completedTables) {
  if (!Number.isInteger(dan) || dan < 1 || dan > 9) {
    throw new RangeError('dan must be an integer from 1 to 9');
  }
  if (!LEVELS.includes(level)) {
    throw new RangeError(`level must be one of: ${LEVELS.join(', ')}`);
  }
  if (!Array.isArray(completedTables)
    || completedTables.some((table) => !Number.isInteger(table) || table < 1 || table > 9)) {
    throw new RangeError('completedTables must contain only integers from 1 to 9');
  }
}

function shuffle(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.min(Math.floor(random() * (index + 1)), index);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function buildRocketChoices(question, random = Math.random, level = 'chick') {
  const closeCandidates = [
    question.multiplicand * Math.max(1, question.multiplier - 1),
    question.multiplicand * Math.min(9, question.multiplier + 1),
    Math.max(1, question.answer - question.multiplier),
    Math.min(81, question.answer + question.multiplier),
    Math.max(1, question.answer - 1),
    Math.min(81, question.answer + 1),
  ];
  const easyCandidates = [
    Math.max(1, question.answer - 10),
    Math.min(81, question.answer + 10),
    Math.max(1, question.answer - 20),
    Math.min(81, question.answer + 20),
  ];
  const candidates = [
    ...(level === 'egg' ? easyCandidates : closeCandidates),
    ...Array.from({ length: 81 }, (_, index) => index + 1)
      .sort((a, b) => Math.abs(a - question.answer) - Math.abs(b - question.answer)),
  ];
  const distractors = [...new Set(candidates)].filter((value) => value !== question.answer).slice(0, 2);
  return Object.freeze(shuffle([question.answer, ...distractors], random));
}

/** 逆向きミッション用に、正しい倍率と近い倍率2つを返す。 */
export function buildRocketFormulaChoices(question, random = Math.random) {
  const candidates = [
    question.multiplier,
    Math.max(1, question.multiplier - 1),
    Math.min(9, question.multiplier + 1),
    Math.max(1, question.multiplier - 2),
    Math.min(9, question.multiplier + 2),
    ...Array.from({ length: 9 }, (_, index) => index + 1),
  ];
  const unique = [...new Set(candidates)];
  return Object.freeze(shuffle([question.multiplier, ...unique.filter((value) => value !== question.multiplier).slice(0, 2)], random));
}

function questionsForTable(dan) {
  return QUESTION_BANK.filter(({ chapter }) => chapter === dan);
}

/** 九九ロケットの9問セッションを作る。 */
export function createRocketSession(dan, level, {
  completedTables = [],
  masteryById = {},
  random = Math.random,
  now = Date.now(),
} = {}) {
  assertSettings(dan, level, completedTables);

  const questions = shuffle(questionsForTable(dan), random);

  return {
    dan,
    level,
    questions: Object.freeze(questions),
    currentIndex: 0,
    currentQuestion: questions[0],
    attempts: [],
    masteryById: { ...masteryById },
    now,
    completed: false,
  };
}

/** 回答と応答時間を記録し、次問へ進む。 */
export function answerRocketQuestion(state, submittedAnswer, responseTimeMs, {
  answeredAt = state.now,
} = {}) {
  if (state.completed || state.currentQuestion === null) {
    throw new Error('rocket session is already complete');
  }
  if (!Number.isFinite(responseTimeMs) || responseTimeMs < 0) {
    throw new RangeError('responseTimeMs must be a non-negative finite number');
  }

  const numericAnswer = typeof submittedAnswer === 'string'
    ? Number(submittedAnswer.trim())
    : submittedAnswer;
  const correct = Number.isFinite(numericAnswer)
    && numericAnswer === state.currentQuestion.answer;
  const attempts = [...state.attempts, {
    questionId: state.currentQuestion.id,
    submittedAnswer,
    correct,
    responseTimeMs,
    answeredAt,
  }];
  const previousMastery = state.masteryById[state.currentQuestion.id]
    ?? createMasteryRecord(state.currentQuestion.id);
  const masteryById = {
    ...state.masteryById,
    [state.currentQuestion.id]: recordAttempt(previousMastery, {
      correct,
      responseTimeMs,
      answeredAt,
    }),
  };
  const currentIndex = state.currentIndex + 1;
  const completed = currentIndex === SESSION_LENGTH;

  return {
    state: {
      ...state,
      currentIndex,
      currentQuestion: completed ? null : state.questions[currentIndex],
      attempts,
      masteryById,
      completed,
    },
    feedback: {
      correct,
      correctAnswer: state.currentQuestion.answer,
      responseTimeMs,
    },
  };
}

export function getRocketProgress(state) {
  const answered = state.attempts.length;
  const correct = state.attempts.filter((attempt) => attempt.correct).length;
  const responseTimes = state.attempts.map(({ responseTimeMs }) => responseTimeMs);
  return {
    answered,
    total: SESSION_LENGTH,
    percent: Math.round((answered / SESSION_LENGTH) * 100),
    correct,
    accuracy: answered === 0 ? 0 : correct / answered,
    averageResponseTimeMs: answered === 0
      ? null
      : Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / answered),
    completed: state.completed,
  };
}

export { LEVELS, SESSION_LENGTH };
