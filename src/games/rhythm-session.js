const MAX_MULTIPLIER = 9;

function assertDan(dan) {
  if (!Number.isInteger(dan) || dan < 1 || dan > 9) {
    throw new RangeError('dan must be an integer from 1 to 9');
  }
}

function makeQuestion(dan, multiplier, kind = 'first') {
  return Object.freeze({
    id: `${dan}x${multiplier}`,
    multiplicand: dan,
    multiplier,
    answer: dan * multiplier,
    kind,
  });
}

/** 選択した段を1倍から順唱する、DOM非依存の初期状態を作る。 */
export function createRhythmSession(dan) {
  assertDan(dan);
  return {
    dan,
    nextMultiplier: 2,
    currentQuestion: makeQuestion(dan, 1),
    presentedCount: 0,
    firstPassSeen: [],
    attempts: [],
    completed: false,
  };
}

function selectNextQuestion(state) {
  if (state.nextMultiplier <= MAX_MULTIPLIER) {
    return {
      question: makeQuestion(state.dan, state.nextMultiplier),
      nextMultiplier: state.nextMultiplier + 1,
    };
  }

  return { question: null, nextMultiplier: state.nextMultiplier };
}

/**
 * 現在問への回答を記録する。誤答時は正答を feedback.correctAnswer で返す。
 * 誤答の有無にかかわらず各問題は一度だけ出題し、状態は破壊的変更しない。
 */
export function answerRhythmQuestion(state, submittedAnswer) {
  if (state.completed || state.currentQuestion === null) {
    throw new Error('rhythm session is already complete');
  }

  const numericAnswer = typeof submittedAnswer === 'string'
    ? Number(submittedAnswer.trim())
    : submittedAnswer;
  const correct = Number.isFinite(numericAnswer)
    && numericAnswer === state.currentQuestion.answer;
  const presentedCount = state.presentedCount + 1;
  const firstPassSeen = state.currentQuestion.kind === 'first'
    ? [...state.firstPassSeen, state.currentQuestion.multiplier]
    : [...state.firstPassSeen];
  const attempts = [...state.attempts, {
    questionId: state.currentQuestion.id,
    multiplier: state.currentQuestion.multiplier,
    kind: state.currentQuestion.kind,
    submittedAnswer,
    correct,
  }];

  const advanced = selectNextQuestion({
    ...state,
    presentedCount,
    firstPassSeen,
    attempts,
  });
  const completed = advanced.question === null
    && firstPassSeen.length === MAX_MULTIPLIER;

  return {
    state: {
      ...state,
      presentedCount,
      firstPassSeen,
      attempts,
      nextMultiplier: advanced.nextMultiplier,
      currentQuestion: advanced.question,
      completed,
    },
    feedback: {
      correct,
      correctAnswer: state.currentQuestion.answer,
      shouldShowCorrectAnswer: !correct,
    },
  };
}

export function getRhythmProgress(state) {
  const introduced = new Set(state.firstPassSeen).size;
  const correctAttempts = state.attempts.filter((attempt) => attempt.correct).length;
  return {
    introduced,
    total: MAX_MULTIPLIER,
    percent: Math.round((introduced / MAX_MULTIPLIER) * 100),
    attempts: state.attempts.length,
    correctAttempts,
    completed: state.completed,
  };
}
